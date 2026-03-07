const PredictionHistory = require('../models/PredictionHistory');
const { generateSummary } = require('../services/geminiService');

async function postSummary(req, res, next) {
  try {
    const { predictionId, riskScore, topFeatures, modelOutput } = req.body;

    let risk = riskScore;
    let features = topFeatures || [];
    let output = modelOutput || {};
    let record = null;

    if (predictionId) {
      record = await PredictionHistory.findOne({
        _id: predictionId,
        userId: req.user._id,
      });
      if (!record) return res.status(404).json({ success: false, message: 'Prediction not found' });
      risk = record.riskScore;
      features = record.topFeatures || [];
      output = record.modelOutput || {};
    }

    // generateSummary already has internal try/catch, but we double-wrap for safety.
    let summary;
    try {
      summary = await generateSummary(risk, features, output);
    } catch (aiErr) {
      console.error('Gemini unavailable, using fallback summary:', aiErr.message);
      summary = `Risk score: ${risk}%. Top factors: ${(features || []).slice(0, 5).map(f => f.name || f.feature || String(f)).join(', ') || 'N/A'}. AI summary temporarily unavailable.`;
    }

    if (record) {
      record.summary = summary;
      await record.save({ validateBeforeSave: false }).catch(() => { });
    }

    // Always return 200 — the prediction itself succeeded regardless of AI summary.
    res.json({ success: true, data: { summary } });
  } catch (err) {
    // This outer catch handles DB errors — still return a graceful response so
    // the frontend prediction result is not lost.
    console.error('postSummary unexpected error:', err.message);
    const risk = req.body.riskScore || 0;
    const features = req.body.topFeatures || [];
    res.json({
      success: true,
      data: {
        summary: `Risk score: ${risk}%. Top factors: ${features.slice(0, 5).map(f => f.name || f.feature || String(f)).join(', ') || 'N/A'}. AI summary temporarily unavailable.`
      }
    });
  }
}

async function postChat(req, res, next) {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const { generateChat } = require('../services/geminiService');
    let reply;
    try {
      reply = await generateChat(message, history || []);
    } catch (aiErr) {
      console.error('Gemini chat unavailable:', aiErr.message);
      reply = 'AI assistant is temporarily unavailable. Please try again shortly.';
    }
    res.json({ success: true, data: { reply } });
  } catch (err) {
    console.error('postChat unexpected error:', err.message);
    res.json({ success: true, data: { reply: 'AI assistant is temporarily unavailable.' } });
  }
}

module.exports = { postSummary, postChat };
