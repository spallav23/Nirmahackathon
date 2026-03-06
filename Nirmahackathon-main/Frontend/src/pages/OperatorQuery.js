import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { chat } from '../api/client';
import styles from '../styles/Query.module.css';

const SAMPLE_QUERIES = [
  'Which inverters in Block B have elevated risk this week?',
  'What is the main cause of risk for INV-204?',
  'Summarize high-risk inverters and recommended actions',
];

export default function OperatorQuery() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendQuery = async () => {
    const q = query.trim();
    if (!q) return;
    setQuery('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await chat.send({ message: q, query: q });
      const answer = res.reply || res.answer || res.message || res.text || JSON.stringify(res);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (e) {
      setError(e.message || 'Failed to get answer');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Demo: Based on current data, INV-201, INV-202 and INV-204 in Block B show elevated risk this week. Recommended: schedule inspection for INV-204 (78% risk).' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.wrap}>
      <header className="layout__header">
        <h1 className="layout__title">Operator Q&A (LLM)</h1>
      </header>
      <p className={styles.subtitle}>Ask natural language questions about inverter risks and get data-backed answers.</p>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.samples}>
        <span className={styles.samplesLabel}>Sample questions:</span>
        {SAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            type="button"
            className={styles.sampleBtn}
            onClick={() => setQuery(q)}
          >
            {q}
          </button>
        ))}
      </div>

      <div className={styles.inputWrap}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuery(); } }}
          placeholder="e.g. Which inverters in Block B have high risk this week?"
          className={styles.textarea}
          rows={2}
          disabled={loading}
        />
        <button type="button" onClick={sendQuery} className={styles.sendBtn} disabled={loading || !query.trim()}>
          {loading ? 'Sending…' : 'Ask'}
        </button>
      </div>

      <section className={styles.messages}>
        {messages.length === 0 && (
          <p className={styles.placeholder}>Your questions and AI answers will appear here.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? styles.msgUser : styles.msgBot}>
            <strong className={styles.msgRole}>{msg.role === 'user' ? 'You' : 'AI'}</strong>
            <p className={styles.msgContent}>{msg.content}</p>
          </div>
        ))}
      </section>
    </motion.div>
  );
}
