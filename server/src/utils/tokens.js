const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn, jwtRefreshExpiresIn, emailVerificationExpiresMinutes, resetPasswordExpiresMinutes } = require('../config/env');

function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function createEmailVerificationToken() {
  const token = generateRandomToken();
  const expires = new Date(Date.now() + emailVerificationExpiresMinutes * 60 * 1000);
  return { token, expires };
}

function createResetPasswordToken() {
  const token = generateRandomToken();
  const expires = new Date(Date.now() + resetPasswordExpiresMinutes * 60 * 1000);
  return { token, expires };
}

function signAccessToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtRefreshExpiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateRandomToken,
  createEmailVerificationToken,
  createResetPasswordToken,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  hashToken,
};
