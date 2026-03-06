const express = require('express');
const { body } = require('express-validator');
const summaryController = require('../controllers/summaryController');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

const summaryValidation = [
  body('predictionId').optional().isMongoId().withMessage('Invalid prediction ID'),
  body('riskScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Risk score must be 0-100'),
  body('topFeatures').optional().isArray(),
  body('modelOutput').optional().isObject(),
];

router.post('/', protect, validate(summaryValidation), summaryController.postSummary);
router.post('/chat', protect, summaryController.postChat);

module.exports = router;
