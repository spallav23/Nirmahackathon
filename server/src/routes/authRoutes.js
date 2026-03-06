const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];
const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];
const refreshValidation = [body('refreshToken').notEmpty().withMessage('Refresh token required')];
const verifyEmailValidation = [body('token').notEmpty().withMessage('Verification token required')];
const resendVerificationValidation = [body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail()];
const forgotPasswordValidation = [body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail()];
const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];
const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);
router.post('/refresh', validate(refreshValidation), authController.refresh);
router.post('/verify-email', validate(verifyEmailValidation), authController.verifyEmail);
// Supports email links like `${FRONTEND_URL}/verify-email?token=...`
router.get('/verify-email', authController.verifyEmailFromQuery);
router.post('/resend-verification', validate(resendVerificationValidation), authController.resendVerification);
router.post('/forgot-password', validate(forgotPasswordValidation), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordValidation), authController.resetPassword);

// Dev bypass: marks email verified instantly without SMTP token wait
router.get('/verify-email-dev/:email', authController.verifyEmailDev);

router.get('/me', protect, authController.me);
router.post('/change-password', protect, validate(changePasswordValidation), authController.changePassword);

module.exports = router;
