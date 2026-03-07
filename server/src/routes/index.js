const express = require('express');
const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const historyRoutes = require('./historyRoutes');
const summaryRoutes = require('./summaryRoutes');
const mlRoutes = require('./mlRoutes');
const apiKeyRoutes = require('./apiKeyRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/history', historyRoutes);
router.use('/summary', summaryRoutes);
router.use('/ml', mlRoutes);
router.use('/api-key', apiKeyRoutes);

module.exports = router;
