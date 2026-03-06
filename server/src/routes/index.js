const express = require('express');
const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const historyRoutes = require('./historyRoutes');
const summaryRoutes = require('./summaryRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/history', historyRoutes);
router.use('/summary', summaryRoutes);

module.exports = router;
