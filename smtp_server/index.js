const express = require('express');
const { Kafka } = require('kafkajs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3002;

// ---------------------------------------------------------------------------
// Google SMTP transporter (uses env vars; will be set in Dockerfile / compose)
// ---------------------------------------------------------------------------
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'spp23102003@gmail.com',
      pass: process.env.SMTP_PASS || 'rcdn jatz eoma egcx',
    },
  });
}

let transporter = null;

function getTransporter() {
  if (!transporter) transporter = createTransporter();
  return transporter;
}

// ---------------------------------------------------------------------------
// Build email from Kafka notification payload
// ---------------------------------------------------------------------------
function buildAlertEmail(payload) {
  const {
    inverterId = 'Unknown',
    riskPercent = 0,
    primaryCause = 'N/A',
    recommendedAction = 'Schedule inspection',
    recipient = process.env.ALERT_EMAIL_TO,
  } = typeof payload === 'string' ? (() => { try { return JSON.parse(payload); } catch { return {}; } })() : (payload || {});

  const subject = `High Risk Alert: Inverter ${inverterId}`;
  const body = [
    `Predicted failure probability: ${riskPercent}%`,
    `Primary cause: ${primaryCause}`,
    `Recommended action: ${recommendedAction}`,
  ].join('\n');

  return {
    to: recipient || process.env.SMTP_USER,
    subject,
    text: body,
    html: `<p>${body.replace(/\n/g, '</p><p>')}</p>`,
  };
}

// ---------------------------------------------------------------------------
// Kafka consumer
// ---------------------------------------------------------------------------
const kafkaBrokers = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',').map((b) => b.trim());
const kafka = new Kafka({
  clientId: 'smtp-notification-service',
  brokers: kafkaBrokers,
});
const consumer = kafka.consumer({ groupId: 'smtp-notification-group' });

async function runConsumer() {
  try {
    await consumer.connect();
    // Use KAFKA_TOPIC_EMAILS to match the main server, default to 'email_events'
    await consumer.subscribe({
      topic: process.env.KAFKA_TOPIC_EMAILS || 'email_events',
      fromBeginning: true,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value ? message.value.toString() : null;
        if (!value) return;

        let payload = {};
        try {
          payload = JSON.parse(value);
        } catch (err) {
          console.error("Failed to parse Kafka message payload", value);
          return;
        }

        let emailOpts = {};

        // If the payload already looks like a constructed email (from Auth controller), use it.
        if (payload.subject && (payload.text || payload.html) && payload.to) {
          emailOpts = {
            to: payload.to,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
            from: payload.from || process.env.SMTP_FROM || process.env.SMTP_USER,
          };
        } else {
          // Otherwise, assume it's a raw Notification/Risk Alert event
          emailOpts = buildAlertEmail(payload);
          emailOpts.from = process.env.SMTP_FROM || process.env.SMTP_USER;
        }

        const transport = getTransporter();

        try {
          await transport.sendMail(emailOpts);
          console.log(`Sent email for subject "${emailOpts.subject}" to ${emailOpts.to}`);
        } catch (err) {
          console.error('Failed to send email:', err.message);
        }
      },
    });
  } catch (err) {
    console.error('Kafka consumer error:', err.message);
    setTimeout(runConsumer, 10000);
  }
}

// ---------------------------------------------------------------------------
// HTTP server & health
// ---------------------------------------------------------------------------
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const server = app.listen(PORT, () => {
  console.log(`SMTP notification service listening on port ${PORT}`);
  runConsumer();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await consumer.disconnect();
  server.close();
  process.exit(0);
});
