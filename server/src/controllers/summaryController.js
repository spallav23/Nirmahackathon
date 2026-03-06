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

    const summary = await generateSummary(risk, features, output);

    if (record) {
      record.summary = summary;
      await record.save({ validateBeforeSave: false });
    }

    res.json({ success: true, data: { summary } });
  } catch (err) {
    next(err);
  }
}

module.exports = { postSummary };
