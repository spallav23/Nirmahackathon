const mongoose = require('mongoose');

const predictionHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    inverterId: { type: String, required: true, index: true },
    requestId: { type: String, index: true, unique: true, sparse: true },
    riskScore: { type: Number, required: true },
    modelOutput: { type: mongoose.Schema.Types.Mixed, default: {} },
    topFeatures: [{ type: mongoose.Schema.Types.Mixed }],
    summary: { type: String, default: '' },
    rawPayload: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

predictionHistorySchema.index({ userId: 1, createdAt: -1 });
predictionHistorySchema.index({ inverterId: 1, createdAt: -1 });

module.exports = mongoose.model('PredictionHistory', predictionHistorySchema);
