const express = require('express');
const mlController = require('../controllers/mlController');
const { protect } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for dataset uploads directly to python server
const upload = multer({ dest: '/tmp/' });
const router = express.Router();

router.get('/models', protect, mlController.getModels);
router.post('/models/active', protect, mlController.setActiveModel);
router.get('/train/progress', protect, mlController.getTrainProgress);
router.post('/train', protect, upload.single('file'), mlController.trainModel);
router.post('/predict', protect, mlController.predict);

module.exports = router;
