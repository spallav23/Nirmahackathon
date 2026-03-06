const { nodeEnv } = require('../config/env');

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({
    success: false,
    message: nodeEnv === 'production' && status === 500 ? 'Internal server error' : message,
    ...(nodeEnv !== 'production' && err.stack && { stack: err.stack }),
  });
}

module.exports = errorHandler;
