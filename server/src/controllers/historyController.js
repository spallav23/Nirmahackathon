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

async function getAnalytics(req, res, next) {
  try {
    const userId = req.user._id;

    // 1. Time-series Risk Trend (Average Risk Score per Day)
    const timeSeries = await PredictionHistory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          avgRisk: { $avg: "$riskScore" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", avgRisk: { $round: ["$avgRisk", 1] }, _id: 0 } }
    ]);

    // 2. Total Risk Distributions (High: >=70, Med: 40-69, Low: <40)
    const riskDistribution = await PredictionHistory.aggregate([
      { $match: { userId } },
      {
        $facet: {
          highRisk: [{ $match: { riskScore: { $gte: 70 } } }, { $count: "count" }],
          mediumRisk: [{ $match: { riskScore: { $gte: 40, $lt: 70 } } }, { $count: "count" }],
          lowRisk: [{ $match: { riskScore: { $lt: 40 } } }, { $count: "count" }]
        }
      },
      {
        $project: {
          highRisk: { $ifNull: [{ $arrayElemAt: ["$highRisk.count", 0] }, 0] },
          mediumRisk: { $ifNull: [{ $arrayElemAt: ["$mediumRisk.count", 0] }, 0] },
          lowRisk: { $ifNull: [{ $arrayElemAt: ["$lowRisk.count", 0] }, 0] },
        }
      }
    ]);

    // 3. Top Failing Factors overall
    const topFactors = await PredictionHistory.aggregate([
      { $match: { userId, "topFeatures.value": { $gt: 0 } } }, // Only positive risk contributors
      { $unwind: "$topFeatures" },
      {
        $group: {
          _id: "$topFeatures.name",
          totalContribution: { $sum: "$topFeatures.value" },
          occurrences: { $sum: 1 }
        }
      },
      { $sort: { totalContribution: -1 } },
      { $limit: 5 },
      {
        $project: {
          name: "$_id",
          totalContribution: { $round: ["$totalContribution", 2] },
          occurrences: 1,
          _id: 0
        }
      }
    ]);

    // 4. Total overall count
    const totalCount = await PredictionHistory.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        totalPredictions: totalCount,
        timeSeries,
        riskDistribution: riskDistribution[0] || { highRisk: 0, mediumRisk: 0, lowRisk: 0 },
        topFactors
      }
    });

  } catch (err) {
    console.error("Analytics Error:", err);
    next(err);
  }
}

async function getLatestPerInverter(req, res, next) {
  try {
    const userId = req.user._id;
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const latest = await PredictionHistory.aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$inverterId",
          inverterId: { $first: "$inverterId" },
          riskScore: { $first: "$riskScore" },
          modelOutput: { $first: "$modelOutput" },
          topFeatures: { $first: "$topFeatures" },
          summary: { $first: "$summary" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          _idRecord: { $first: "$_id" },
        },
      },
      { $sort: { riskScore: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: "$_idRecord",
          inverterId: 1,
          riskScore: 1,
          modelOutput: 1,
          topFeatures: 1,
          summary: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    res.json({ success: true, data: { inverters: latest } });
  } catch (err) {
    next(err);
  }
}

async function getInverterTrend(req, res, next) {
  try {
    const userId = req.user._id;
    const inverterId = String(req.params.inverterId);
    const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 14));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const points = await PredictionHistory.find({ userId, inverterId, createdAt: { $gte: since } })
      .sort({ createdAt: 1 })
      .select({ riskScore: 1, createdAt: 1, _id: 0 })
      .lean();

    res.json({
      success: true,
      data: {
        inverterId,
        days,
        points: points.map((p) => ({ ts: p.createdAt, riskScore: p.riskScore })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHistory, getHistoryById, getAnalytics, getLatestPerInverter, getInverterTrend };
