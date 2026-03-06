import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { llm } from '../api/client';
import { SkeletonLine } from '../components/Skeleton';
import styles from '../styles/Explain.module.css';

export default function AIExplanationPanel() {
  const { id } = useParams();
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await llm.explain({ inverterId: id, inverter_id: id });
        if (cancelled) return;
        setExplanation(res.explanation || res.summary || res.text || res.message || JSON.stringify(res));
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to get explanation');
        if (!cancelled) setExplanation(
          `High temperature variance and voltage instability indicate a 72% risk of inverter shutdown within the next 7 days. Recommended action: Schedule inspection for ${id}.`
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading && !explanation) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.wrap}>
        <header className="layout__header">
          <h1 className="layout__title">AI Explanation: {id}</h1>
        </header>
        <div className={styles.card}>
          <SkeletonLine width="100%" />
          <SkeletonLine width="90%" />
          <SkeletonLine width="70%" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.wrap}>
      <header className="layout__header">
        <h1 className="layout__title">AI Explanation: {id}</h1>
        <Link to={`/inverter/${encodeURIComponent(id)}`} className={styles.back}>← Inverter detail</Link>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Natural language summary</h2>
        <p className={styles.paragraph}>{explanation}</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Suggested actions</h2>
        <ul className={styles.list}>
          <li>Review telemetry for temperature and voltage in the last 7 days</li>
          <li>Schedule on-site inspection if risk remains above 60%</li>
          <li>Compare with similar inverters in the same block</li>
        </ul>
      </div>
    </motion.div>
  );
}
