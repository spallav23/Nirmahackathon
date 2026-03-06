require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/inverter_platform',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com',
  },
  emailVerificationExpiresMinutes: parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES, 10) || 60 * 24, // 24h
  resetPasswordExpiresMinutes: parseInt(process.env.RESET_PASSWORD_EXPIRES_MINUTES, 10) || 60, // 1h
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  kafkaBrokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',').map((b) => b.trim()),
  kafkaTopicPredictions: process.env.KAFKA_TOPIC_PREDICTIONS || 'prediction_events',
};
