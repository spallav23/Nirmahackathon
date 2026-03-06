const express = require('express');
const historyController = require('../controllers/historyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, historyController.getHistory);
router.get('/:id', protect, historyController.getHistoryById);

module.exports = router;
