const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { Kafka } = require('kafkajs');
const PredictionHistory = require('../models/PredictionHistory');
const { generateSummary } = require('../services/geminiService');
const { log } = require('console');

// Kafka Setup for Alerts
const kafkaBrokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',').map((b) => b.trim());
const kafkaTopicEmails = process.env.KAFKA_TOPIC_EMAILS || 'email_events';
let kafkaProducer = null;

async function getKafkaProducer() {
    if (kafkaProducer) return kafkaProducer;
    if (!kafkaBrokers || !kafkaBrokers.length) return null;
    const kafka = new Kafka({
        clientId: 'ml-controller-producer',
        brokers: kafkaBrokers,
    });
    kafkaProducer = kafka.producer();
    try {
        await kafkaProducer.connect();
        return kafkaProducer;
    } catch (err) {
        console.error('Kafka Producer connection error:', err.message);
        kafkaProducer = null;
        return null;
    }
}

// ML Server runs on 8000 by default (check docker-compose or run instructions)
const ML_BASE_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';

async function getModels(req, res, next) {
    try {
        const response = await axios.get(`${ML_BASE_URL}/models`, { timeout: 10000 });
        res.json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        res.status(502).json({ success: false, message: 'Could not reach ML server.' });
    }
}

async function setActiveModel(req, res, next) {
    try {
        const { model_id } = req.body;
        if (!model_id) return res.status(400).json({ success: false, message: 'model_id is required' });

        const response = await axios.post(`${ML_BASE_URL}/models/active`, { model_id }, { timeout: 10000 });
        res.json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        res.status(502).json({ success: false, message: 'Could not reach ML server.' });
    }
}

async function getTrainProgress(req, res, next) {
    try {
        const response = await axios.get(`${ML_BASE_URL}/train/progress`);
        res.json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        res.status(502).json({ success: false, message: 'Could not fetch progress from ML server.' });
    }
}

async function getDatasetSummary(req, res, next) {
    try {
        const response = await axios.get(`${ML_BASE_URL}/dataset/summary`, { timeout: 15000 });
        res.json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        res.status(502).json({ success: false, message: 'Could not fetch dataset summary from ML server. It may still be initialising — please try again in a moment.' });
    }
}

async function getDatasetInverters(req, res, next) {
    try {
        const response = await axios.get(`${ML_BASE_URL}/dataset/inverters`);
        res.json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        res.status(502).json({ success: false, message: 'Could not fetch active inverters from ML server.' });
    }
}

async function getDatasetInverterHistory(req, res, next) {
    try {
        let { inverterId } = req.params;
        const limit = req.query.limit || 50;
        const response = await axios.get(`${ML_BASE_URL}/dataset/inverters/${inverterId}?limit=${limit}`);
        res.json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        res.status(502).json({ success: false, message: 'Could not fetch inverter history from ML server.' });
    }
}

async function getModelFeatures(req, res, next) {
    try {
        const response = await axios.get(`${ML_BASE_URL}/models/features`, { timeout: 10000 });
        res.json(response.data);
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        res.status(502).json({ success: false, message: 'Could not fetch model features from ML server.' });
    }
}

async function trainModel(req, res, next) {
    try {
        const form = new FormData();
        // If file provided, attach it. If not, ML server falls back to default dataset
        if (req.file) {
            form.append('file', fs.createReadStream(req.file.path), req.file.originalname);
        }

        const url = req.query.model_type
            ? `${ML_BASE_URL}/train?model_type=${req.query.model_type}`
            : `${ML_BASE_URL}/train`;

        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        // Cleanup temp file
        if (req.file) fs.unlinkSync(req.file.path);

        res.json(response.data);
    } catch (err) {
        if (req.file) fs.unlinkSync(req.file.path);
        if (err.response) return res.status(err.response.status).json(err.response.data);
        res.status(502).json({ success: false, message: 'Could not reach ML server.' });
    }
}

async function predict(req, res, next) {
    try {
        let invID = req.body.inverterId || req.body.inverter_id;
        let telemetry = req.body.telemetry || req.body.features;

        if (invID && (telemetry || req.body.telemetry !== undefined)) {
            try {
                const histRes = await axios.get(`${ML_BASE_URL}/dataset/inverters/${invID}?limit=1`, { timeout: 8000 });
                if (histRes.data && histRes.data.success && Array.isArray(histRes.data.data) && histRes.data.data.length > 0) {
                    const lastRow = histRes.data.data[histRes.data.data.length - 1];
                    const base = {};
                    for (const [k, v] of Object.entries(lastRow)) {
                        if (k === 'datetime' || k === 'inverter_id') continue;
                        if (typeof v === 'number' || (typeof v === 'string' && v !== '' && !isNaN(Number(v)))) base[k] = Number(v);
                    }
                    telemetry = { ...base, ...(telemetry && typeof telemetry === 'object' ? telemetry : {}) };
                }
            } catch (_) { /* use request telemetry only if history fetch fails */ }
        }
        if (!telemetry || typeof telemetry !== 'object') telemetry = req.body.telemetry || req.body.features || {};

        const payload = {
            ...req.body,
            user_id: req.user._id,
            telemetry: Object.keys(telemetry).length ? telemetry : req.body.telemetry,
            features: req.body.features,
        };
        const response = await axios.post(`${ML_BASE_URL}/predict`, payload, { timeout: 30000 });

        // Normalize ML server response into our API shape expected by the frontend.
        const ml = response.data || {};
        const requestId = ml.request_id || ml.requestId || null;
        const inverterId = ml.inverter_id || ml.inverterId || req.body.inverterId || 'unknown';
        const riskScore = Number(ml.risk_score ?? ml.riskScore ?? 0);
        const topFeatures = ml.top_features || ml.topFeatures || [];
        const modelOutput = ml.model_output || ml.modelOutput || {};

        // Generate AI summary (non-blocking fallback if Gemini quota exceeded)
        let summary = '';
        try {
            summary = await generateSummary(riskScore, topFeatures, modelOutput);
        } catch (_) {
            summary = '';
        }

        const doc = {
            userId: req.user._id,
            inverterId: String(inverterId),
            riskScore,
            modelOutput,
            topFeatures,
            summary,
            rawPayload: { mlResponse: ml, requestBody: req.body }
        };

        let record;
        try {
            if (requestId) {
                // use updateOne + upsert so we always hit the unique index path
                // and avoid a second round‑trip when we just want to insert if
                // there isn't already a document with the same requestId.
                await PredictionHistory.updateOne(
                    { requestId },
                    { $setOnInsert: { ...doc, requestId } },
                    { upsert: true }
                );
                // read back the document for the response (could have been
                // newly inserted or existing from a concurrent Kafka event)
                record = await PredictionHistory.findOne({ requestId });
            } else {
                record = await PredictionHistory.create(doc);
            }
        } catch (dbErr) {
            // 11000 = duplicate key.  This can still occur in a narrow race if
            // two writers try to insert the same requestId at the same time.
            // Treat duplicates as a no‑op by returning whatever already exists.
            const isDuplicate = dbErr.code === 11000 ||
                (dbErr.errorResponse && dbErr.errorResponse.code === 11000);
            if (isDuplicate && requestId) {
                record = await PredictionHistory.findOne({ requestId });
            }
            if (!record) throw dbErr; // anything else should bubble up
        }

        res.json({
            success: true,
            data: record.toObject ? record.toObject() : record
        });
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        res.status(502).json({ success: false, message: 'Could not reach ML server.', error: err });
    }
}


async function scheduleInspection(req, res, next) {
    try {
        const { inverterId, riskScore, recommendedAction } = req.body;

        if (!inverterId) {
            return res.status(400).json({ success: false, message: 'inverterId is required' });
        }

        const producer = await getKafkaProducer();
        if (!producer) {
            return res.status(503).json({ success: false, message: 'Message broker is currently unavailable. Cannot schedule inspection.' });
        }

        const payload = {
            inverterId,
            riskPercent: riskScore || 0,
            primaryCause: 'Manual Operator Intervention Required',
            recommendedAction: recommendedAction || 'Operator has scheduled an immediate inspection.'
        };

        await producer.send({
            topic: kafkaTopicEmails,
            messages: [{ value: JSON.stringify(payload) }],
        });

        res.json({ success: true, message: 'Inspection scheduled. An alert email has been dispatched to the maintenance team.' });
    } catch (err) {
        console.error('Failed to schedule inspection via Kafka:', err);
        res.status(500).json({ success: false, message: 'Failed to schedule inspection.' });
    }
}

module.exports = {
    getModels,
    setActiveModel,
    getTrainProgress,
    getDatasetSummary,
    getDatasetInverters,
    getDatasetInverterHistory,
    getModelFeatures,
    trainModel,
    predict,
    scheduleInspection
};
