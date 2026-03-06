const nodemailer = require('nodemailer');
const { smtp, frontendUrl } = require('../config/env');

let transporter = null;

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
  const transport = getTransporter();
  const from = options.from || smtp.from;
  if (!transport) {
    console.log('[Email (no SMTP)]', { to: options.to, subject: options.subject });
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
