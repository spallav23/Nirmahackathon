const { verifyToken } = require('../utils/tokens');
const User = require('../models/User');

/**
 * Protect routes - require valid JWT and attach req.user
 */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized; token missing' });
    }
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    next(err);
  }
}

/**
 * Optional auth - attach user if token present, do not require it
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return next();
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
}

/**
 * Require specific roles
 */
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * API Key Auth - authenticate users via x-api-key header
 */
async function apiKeyAuth(req, res, next) {
  try {
    const key = req.headers['x-api-key'];
    if (!key) {
      return res.status(401).json({ success: false, message: 'API key missing. Provide x-api-key header.' });
    }
    const user = await User.findOne({ apiKey: key }).select('+apiKey');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid API key.' });
    }
    if (!user.isEmailVerified) {
      return res.status(403).json({ success: false, message: 'Email verification required to use this API key.' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { protect, optionalAuth, requireRoles, apiKeyAuth };
