const { GoogleGenerativeAI } = require('@google/generative-ai');
const { googleApiKey, googleGeminiModel } = require('../config/env');

// The generated model name must match the API's expected format. Convert
// user-friendly values like "Gemini 2.5 Flash" into something like
// "models/gemini-2.5-flash". This helper keeps the service resilient to
// a misconfigured environment variable.
function normalizeModelName(raw) {
  if (!raw) return '';
  let m = raw.toString().trim().toLowerCase();
  m = m.replace(/\s+/g, '-');
  if (!m.startsWith('models/')) {
    m = `models/${m}`;
  }
  return m;
}

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
    const model = client.getGenerativeModel({ model: normalizeModelName(googleGeminiModel) });
    const result = await model.generateContent(SUMMARY_PROMPT(riskScore, topFeatures, modelOutput));
    const text = result.response?.text?.()?.trim() || '';
    return text || `Risk score: ${riskScore}%. Review top factors and schedule inspection if needed.`;
  } catch (err) {
    console.error('Gemini summary error:', err.message);
    return `Risk score: ${riskScore}%. Top factors: ${(topFeatures || []).slice(0, 5).map((f) => (f.name || f.feature || f).toString()).join(', ')}.`;
  }
}

async function generateChat(message, history = []) {
  const client = getClient();
  if (!client) {
    return "Google Gemini API key not configured. Mock Mode: I am an AI assistant.";
  }
  try {
    const model = client.getGenerativeModel({ model: normalizeModelName(googleGeminiModel) });
    const chatPrompt = `You are a helpful AI assistant for a solar inverter predictive maintenance platform.
Context History:
${history.map(m => (m.role === 'user' ? 'Operator' : 'AI') + ': ' + m.text).join('\n')}
Operator: ${message}
AI:`;
    const result = await model.generateContent(chatPrompt);
    return result.response?.text?.()?.trim() || "I couldn't generate a response.";
  } catch (err) {
    console.error('Gemini chat error:', err.message);
    return "Error communicating with the generative AI model.";
  }
}

module.exports = { generateChat, generateSummary, getClient };
