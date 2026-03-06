const PredictionHistory = require('../models/PredictionHistory');

async function getHistory(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const inverterId = req.query.inverterId;

    const filter = { userId: req.user._id };
    if (inverterId) filter.inverterId = inverterId;

    const [items, total] = await Promise.all([
      PredictionHistory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PredictionHistory.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        history: items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getHistoryById(req, res, next) {
  try {
    const doc = await PredictionHistory.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'History record not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHistory, getHistoryById };
