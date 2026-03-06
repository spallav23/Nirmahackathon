const nodemailer = require('nodemailer');
const { Kafka } = require('kafkajs');
const { smtp, frontendUrl, kafkaBrokers, kafkaTopicEmails } = require('../config/env');

let transporter = null;
let kafkaProducer = null;

async function getKafkaProducer() {
  if (kafkaProducer) return kafkaProducer;
  if (!kafkaBrokers || !kafkaBrokers.length) return null;
  const kafka = new Kafka({
    clientId: 'email-producer',
    brokers: kafkaBrokers,
  });
  kafkaProducer = kafka.producer();
  try {
    await kafkaProducer.connect();
    return kafkaProducer;
  } catch (err) {
    console.error('Kafka Producer connection error:', err.message);
    kafkaProducer = null;
    return null;
  }
}

function getTransporter() {
  if (transporter) return transporter;
  if (!smtp.user || !smtp.pass) {
    console.warn('SMTP not configured; auth emails will be logged only');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  return transporter;
}

async function sendMail(options) {
  const producer = await getKafkaProducer();
  const from = options.from || smtp.from;

  if (producer) {
    try {
      await producer.send({
        topic: kafkaTopicEmails,
        messages: [{ value: JSON.stringify({ ...options, from }) }],
      });
      console.log(`[Email] Kafka event sent to topic ${kafkaTopicEmails} for ${options.to}`);
      return;
    } catch (err) {
      console.error('[Email] Failed to send Kafka event:', err.message);
    }
  }

  // Fallback to Nodemailer if Kafka is not available or fails
  const transport = getTransporter();
  if (!transport) {
    console.log('[Email (no SMTP, no Kafka)]', { to: options.to, subject: options.subject });
    return;
  }
  await transport.sendMail({ ...options, from });
}

function verificationEmail(to, name, token) {
  const link = `${frontendUrl}/verify-email?token=${token}`;
  return {
    to,
    subject: 'Verify your email - Inverter Platform',
    text: `Hi ${name},\n\nPlease verify your email by opening this link:\n${link}\n\nLink expires in 24 hours.`,
    html: `<p>Hi ${name},</p><p>Please verify your email by clicking <a href="${link}">here</a>.</p><p>Link expires in 24 hours.</p>`,
  };
}

function resetPasswordEmail(to, name, token) {
  const link = `${frontendUrl}/reset-password?token=${token}`;
  return {
    to,
    subject: 'Reset your password - Inverter Platform',
    text: `Hi ${name},\n\nReset your password here:\n${link}\n\nLink expires in 1 hour.`,
    html: `<p>Hi ${name},</p><p>Reset your password by clicking <a href="${link}">here</a>.</p><p>Link expires in 1 hour.</p>`,
  };
}

module.exports = { sendMail, verificationEmail, resetPasswordEmail };
