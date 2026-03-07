const express = require('express');
const { protect } = require('../middleware/auth');
const { apiKeyAuth } = require('../middleware/auth');
const apiKeyController = require('../controllers/apiKeyController');

const router = express.Router();

// JWT-protected routes (requires user to be logged in)
router.post('/generate', protect, apiKeyController.generateApiKey);
router.get('/', protect, apiKeyController.getApiKey);
router.delete('/', protect, apiKeyController.revokeApiKey);
router.get('/predictions', protect, apiKeyController.getApiPredictions);

// API-key authenticated route (for external IoT / scripts)
router.post('/predict', apiKeyAuth, apiKeyController.predictViaApiKey);

module.exports = router;
