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

// ---------------------------------------------------------------------------
// Rate-limit guard
// ---------------------------------------------------------------------------
// Track if we are currently in a 429 back-off window. When we receive a 429
// from Gemini we set _blockedUntil to Date.now() + retryAfterMs so later
// calls skip the API entirely and return the fallback immediately.
let _blockedUntil = 0;

function _isBlocked() {
  return Date.now() < _blockedUntil;
}

/**
 * Attempts to parse the retry-after delay from a Gemini 429 error message.
 * Falls back to 60 seconds if it can't parse.
 */
function _parseRetryDelay(errMessage = '') {
  const match = errMessage.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1])) * 1000;
  }
  return 60_000; // default: wait 60 s
}

function _fallbackSummary(riskScore, topFeatures = []) {
  const factors = (topFeatures || [])
    .slice(0, 5)
    .map(f => (f.name || f.feature || String(f)))
    .join(', ');
  return `Risk score: ${riskScore}%. Top factors: ${factors || 'N/A'}.`;
}

// Trim modelOutput before sending to Gemini to stay under token limits
function _trimOutput(modelOutput) {
  if (!modelOutput || typeof modelOutput !== 'object') return {};
  const keys = Object.keys(modelOutput);
  if (keys.length <= 10) return modelOutput;
  const trimmed = {};
  keys.slice(0, 10).forEach(k => { trimmed[k] = modelOutput[k]; });
  return trimmed;
}

const SUMMARY_PROMPT = (riskScore, topFeatures) =>
  `Solar inverter failure prediction result. Write a 2-3 sentence operator summary covering: risk level, main contributing factors, and one recommended action.

Risk score (0-100): ${riskScore}
Top factors: ${JSON.stringify((topFeatures || []).slice(0, 5))}

Summary:`;

async function generateSummary(riskScore, topFeatures = [], modelOutput = {}) {
  const client = getClient();
  if (!client) {
    return _fallbackSummary(riskScore, topFeatures);
  }

  // If we're currently rate-limited, return the fallback immediately.
  if (_isBlocked()) {
    const waitSec = Math.ceil((_blockedUntil - Date.now()) / 1000);
    console.warn(`[gemini] Rate-limited — returning fallback (${waitSec}s remaining).`);
    return _fallbackSummary(riskScore, topFeatures);
  }

  try {
    const model = client.getGenerativeModel({ model: normalizeModelName(googleGeminiModel) });
    // Use a shorter prompt (no modelOutput) to minimise token usage
    const result = await model.generateContent(SUMMARY_PROMPT(riskScore, topFeatures));
    const text = result.response?.text?.()?.trim() || '';
    return text || _fallbackSummary(riskScore, topFeatures);
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      const delay = _parseRetryDelay(msg);
      _blockedUntil = Date.now() + delay;
      console.warn(`[gemini] 429 received — will skip API for ${Math.round(delay / 1000)}s.`);
    } else {
      console.error('Gemini summary error:', msg);
    }
    return _fallbackSummary(riskScore, topFeatures);
  }
}

async function generateChat(message, history = []) {
  const client = getClient();
  if (!client) {
    return 'Google Gemini API key not configured. Mock Mode: I am an AI assistant.';
  }
  if (_isBlocked()) {
    const waitSec = Math.ceil((_blockedUntil - Date.now()) / 1000);
    return `AI assistant is temporarily rate-limited. Please try again in ~${waitSec} seconds.`;
  }
  try {
    const model = client.getGenerativeModel({ model: normalizeModelName(googleGeminiModel) });
    const chatPrompt = `You are a helpful AI assistant for a solar inverter predictive maintenance platform.
Context History:
${history.slice(-4).map(m => (m.role === 'user' ? 'Operator' : 'AI') + ': ' + m.text).join('\n')}
Operator: ${message}
AI:`;
    const result = await model.generateContent(chatPrompt);
    return result.response?.text?.()?.trim() || "I couldn't generate a response.";
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      const delay = _parseRetryDelay(msg);
      _blockedUntil = Date.now() + delay;
      const waitSec = Math.ceil(delay / 1000);
      console.warn(`[gemini] 429 on chat — will skip API for ${waitSec}s.`);
      return `AI assistant is temporarily rate-limited. Please try again in ~${waitSec} seconds.`;
    }
    console.error('Gemini chat error:', msg);
    return 'Error communicating with the generative AI model.';
  }
}

module.exports = { generateChat, generateSummary, getClient };
