const { Kafka } = require('kafkajs');
const { kafkaBrokers, kafkaTopicPredictions } = require('../config/env');
const PredictionHistory = require('../models/PredictionHistory');
const { generateSummary } = require('./geminiService');

let consumer = null;

function parsePayload(value) {
  if (!value) return null;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

async function savePrediction(payload) {
  const {
    requestId,
    userId,
    inverterId,
    riskScore,
    modelOutput = {},
    topFeatures = [],
    rawPayload,
  } = payload;

  if (inverterId == null && riskScore == null) return;

  const doc = {
    userId: userId || null,
    inverterId: String(inverterId || 'unknown'),
    requestId: requestId || null,
    riskScore: Number(riskScore) ?? 0,
    modelOutput,
    topFeatures: Array.isArray(topFeatures) ? topFeatures : [],
    rawPayload: rawPayload || payload,
  };

  try {
    let summary = '';
    try {
      summary = await generateSummary(doc.riskScore, doc.topFeatures, doc.modelOutput);
    } catch (e) {
      console.warn('Summary generation failed:', e.message);
    }
    doc.summary = summary;
    // Prevent duplicates if the main-server already stored this prediction synchronously.
    if (doc.requestId) {
      const existing = await PredictionHistory.findOne({ requestId: doc.requestId }).lean();
      if (existing) return;
    }
    await PredictionHistory.create(doc);
    console.log('Stored prediction from Kafka:', doc.inverterId, doc.riskScore);
  } catch (err) {
    console.error('Failed to save prediction:', err.message);
  }
}

async function runConsumer() {
  if (!kafkaBrokers.length) {
    console.warn('Kafka brokers not configured; prediction consumer disabled');
    return null;
  }

  const kafka = new Kafka({
    clientId: 'main-server-consumer',
    brokers: kafkaBrokers,
  });

  consumer = kafka.consumer({ groupId: 'main-server-prediction-history' });

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: kafkaTopicPredictions, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const value = message.value ? message.value.toString() : null;
        const payload = parsePayload(value);
        if (payload) await savePrediction(payload);
      },
    });
    console.log('Kafka consumer subscribed to', kafkaTopicPredictions);
  } catch (err) {
    console.error('Kafka consumer error:', err.message);
    throw err;
  }

  return consumer;
}

async function stopConsumer() {
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
    console.log('Kafka consumer disconnected');
  }
}

module.exports = { runConsumer, stopConsumer };
