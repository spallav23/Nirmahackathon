const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const PredictionHistory = require('../models/PredictionHistory');

const ML_BASE_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';

/**
 * POST /api-key/generate
 * Generates (or regenerates) an API key for the authenticated user.
 * Requires email verification.
 */
async function generateApiKey(req, res, next) {
    try {
        if (!req.user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Email verification required to generate an API key.'
            });
        }

        const rawKey = crypto.randomBytes(32).toString('hex');
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { apiKey: rawKey },
            { new: true, select: '+apiKey' }
        );

        // Return the full key ONCE — after this it will only be shown masked
        res.json({
            success: true,
            message: 'API key generated successfully. Save this key — it will not be shown again in full.',
            data: { apiKey: user.apiKey }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api-key
 * Returns a masked version of the current API key (or null if none).
 */
async function getApiKey(req, res, next) {
    try {
        const user = await User.findById(req.user._id).select('+apiKey');
        if (!user.apiKey) {
            return res.json({ success: true, data: { apiKey: null } });
        }
        // Mask: show first 8 and last 4 chars
        const masked = user.apiKey.substring(0, 8) + '••••••••••••••••••••' + user.apiKey.slice(-4);
        res.json({ success: true, data: { apiKey: masked } });
    } catch (err) {
        next(err);
    }
}

/**
 * DELETE /api-key
 * Revokes (clears) the user's API key.
 */
async function revokeApiKey(req, res, next) {
    try {
        await User.findByIdAndUpdate(req.user._id, { $unset: { apiKey: 1 } });
        res.json({ success: true, message: 'API key revoked.' });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api-key/predict
 * Accept telemetry from external clients (IoT / scripts) authenticated by API key.
 * Body: { inverterId, modelId?, telemetry: {...} }
 */
async function predictViaApiKey(req, res, next) {
    try {
        const { inverterId, modelId, telemetry } = req.body;

        if (!inverterId) {
            return res.status(400).json({ success: false, message: 'inverterId is required.' });
        }
        if (!telemetry || typeof telemetry !== 'object') {
            return res.status(400).json({ success: false, message: 'telemetry object is required.' });
        }

        // Forward to ML server
        const payload = { inverterId, telemetry };
        if (modelId) payload.modelId = modelId;

        const mlRes = await axios.post(`${ML_BASE_URL}/predict`, payload);

        // ML server can return either a flat response or {success, data:{...}} shape.
        // Normalise defensively.
        const raw = mlRes.data || {};
        const ml = raw.data || raw;  // unwrap nested data if present

        const requestId = ml.request_id || ml.requestId || undefined;
        const riskScore = Number(ml.risk_score ?? ml.riskScore ?? 0);
        const topFeatures = ml.top_features || ml.topFeatures || [];
        const modelOutput = ml.model_output || ml.modelOutput || {};

        // Persist prediction tagged with source 'api'
        const record = await PredictionHistory.create({
            userId: req.user._id,
            inverterId: String(inverterId),
            requestId,
            riskScore,
            modelOutput,
            topFeatures,
            rawPayload: telemetry,
            source: 'api'
        });

        res.json({
            success: true,
            data: {
                _id: record._id,
                inverterId,
                riskScore,
                topFeatures,
                modelOutput,
                createdAt: record.createdAt
            }
        });
    } catch (err) {
        if (err.response) {
            return res.status(err.response.status).json({
                success: false,
                message: 'ML server error',
                detail: err.response.data
            });
        }
        next(err);
    }
}

/**
 * GET /api-key/predictions
 * Returns the authenticated user's recent API-sourced predictions.
 */
async function getApiPredictions(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            PredictionHistory.find({ userId: req.user._id, source: 'api' })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            PredictionHistory.countDocuments({ userId: req.user._id, source: 'api' })
        ]);

        res.json({
            success: true,
            data: { records, total, page, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { generateApiKey, getApiKey, revokeApiKey, predictViaApiKey, getApiPredictions };
