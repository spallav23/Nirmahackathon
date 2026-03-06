const { GoogleGenerativeAI } = require('@google/generative-ai');
const { googleApiKey } = require('../config/env');

let genAI = null;

function getClient() {
  if (!googleApiKey) return null;
  if (!genAI) genAI = new GoogleGenerativeAI(googleApiKey);
  return genAI;
}

const SUMMARY_PROMPT = (riskScore, topFeatures, modelOutput) =>
  `You are an expert for a solar inverter failure prediction platform. Given the following prediction result, write a short, clear summary (2-4 sentences) for an operator. Focus on: risk level, main contributing factors, and one recommended action. Use plain English.

Risk score (0-100): ${riskScore}
Top contributing features: ${JSON.stringify(topFeatures || [])}
Model output (if any): ${JSON.stringify(modelOutput || {})}

Summary:`;

async function generateSummary(riskScore, topFeatures = [], modelOutput = {}) {
  const client = getClient();
  if (!client) {
    return `Risk score: ${riskScore}%. Top factors: ${(topFeatures || []).map((f) => (f.name || f.feature || f).toString()).join(', ')}.`;
  }
  try {
    const model = client.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(SUMMARY_PROMPT(riskScore, topFeatures, modelOutput));
    const text = result.response?.text?.()?.trim() || '';
    return text || `Risk score: ${riskScore}%. Review top factors and schedule inspection if needed.`;
  } catch (err) {
    console.error('Gemini summary error:', err.message);
    return `Risk score: ${riskScore}%. Top factors: ${(topFeatures || []).slice(0, 5).map((f) => (f.name || f.feature || f).toString()).join(', ')}.`;
  }
}

module.exports = { generateSummary, getClient };
