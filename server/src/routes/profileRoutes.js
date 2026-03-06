const express = require('express');
const { body } = require('express-validator');
const profileController = require('../controllers/profileController');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

const updateValidation = [
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Name too long'),
  body('email').optional().trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone too long'),
  body('avatar').optional().trim().isLength({ max: 500 }).withMessage('Avatar too long'),
];

router.get('/', protect, profileController.getProfile);
router.put('/', protect, validate(updateValidation), profileController.updateProfile);

module.exports = router;
