const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const PredictionHistory = require('../models/PredictionHistory');
const { generateSummary } = require('../services/geminiService');

// ML Server runs on 8000 by default (check docker-compose or run instructions)
const ML_BASE_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';

async function getModels(req, res, next) {
    try {
        const response = await axios.get(`${ML_BASE_URL}/models`);
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

        const response = await axios.post(`${ML_BASE_URL}/models/active`, { model_id });
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
        const payload = {
            ...req.body,
            user_id: req.user._id // Pass user auth automatically
        };
        const response = await axios.post(`${ML_BASE_URL}/predict`, payload);

        // Normalize ML server response into our API shape expected by the frontend.
        const ml = response.data || {};
        const requestId = ml.request_id || ml.requestId || null;
        const inverterId = ml.inverter_id || ml.inverterId || req.body.inverterId || 'unknown';
        const riskScore = Number(ml.risk_score ?? ml.riskScore ?? 0);
        const topFeatures = ml.top_features || ml.topFeatures || [];
        const modelOutput = ml.model_output || ml.modelOutput || {};

        // Store prediction history immediately so UI can reference _id (avoid waiting on Kafka).
        let summary = '';
        try {
            summary = await generateSummary(riskScore, topFeatures, modelOutput);
        } catch (_) {
            summary = '';
        }

        const record = await PredictionHistory.create({
            userId: req.user._id,
            inverterId: String(inverterId),
            requestId,
            riskScore,
            modelOutput,
            topFeatures,
            summary,
            rawPayload: { mlResponse: ml, requestBody: req.body }
        });

        res.json({
            success: true,
            data: record.toObject ? record.toObject() : record
        });
    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        res.status(502).json({ success: false, message: 'Could not reach ML server.' });
    }
}

module.exports = {
    getModels,
    setActiveModel,
    getTrainProgress,
    trainModel,
    predict
};
