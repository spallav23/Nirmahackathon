const { Kafka } = require('kafkajs');
const { kafkaBrokers, kafkaTopicPredictions } = require('../config/env');
const PredictionHistory = require('../models/PredictionHistory');

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
    summary = '',
  } = payload;

  if (inverterId == null && riskScore == null) return;

  // Prevent duplicates — the main request path already stores predictions
  // synchronously via mlController. Only persist if we don't have a matching record.
  // build document once; we might upsert or create depending on requestId
  const doc = {
    userId: userId || null,
    inverterId: String(inverterId || 'unknown'),
    requestId: requestId || null,
    riskScore: Number(riskScore) ?? 0,
    modelOutput,
    topFeatures: Array.isArray(topFeatures) ? topFeatures : [],
    rawPayload: rawPayload || payload,
    // Re-use the summary that the ML server already generated (if present in payload).
    // Do NOT call Gemini here — the API request path handles that, and calling it
    // again for every Kafka message exhausts the free-tier quota rapidly.
    summary,
  };

  try {
    if (doc.requestId) {
      // Upsert by requestId; this covers the race with the HTTP path as well as
      // duplicate deliveries from Kafka.  updateOne with upsert will only
      // perform an insert when no matching document exists, and if two
      // processes race we'll catch the 11000 later.
      await PredictionHistory.updateOne(
        { requestId: doc.requestId },
        { $setOnInsert: doc },
        { upsert: true }
      );
    } else {
      await PredictionHistory.create(doc);
    }
    console.log('Stored prediction from Kafka:', doc.inverterId, doc.riskScore);
  } catch (err) {
    const isDuplicate = err.code === 11000 || (err.errorResponse && err.errorResponse.code === 11000);
    if (isDuplicate) {
      // duplicate entry — harmless, happens when two writers race.  quiet it.
      console.debug('Ignored duplicate prediction for', doc.requestId);
    } else {
      console.error('Failed to save prediction:', err.message);
    }
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
