const express = require('express');
const historyController = require('../controllers/historyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, historyController.getHistory);
router.get('/analytics', protect, historyController.getAnalytics);
router.get('/inverters/latest', protect, historyController.getLatestPerInverter);
router.get('/inverters/:inverterId/trend', protect, historyController.getInverterTrend);
router.get('/:id', protect, historyController.getHistoryById);

module.exports = router;
