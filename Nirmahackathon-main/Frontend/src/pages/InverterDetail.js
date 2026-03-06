import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { predictions } from '../api/client';
import { SkeletonCard, SkeletonLine } from '../components/Skeleton';
import styles from '../styles/Detail.module.css';

function getRiskLevel(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export default function InverterDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await predictions.history();
        const list = Array.isArray(res.predictions) ? res.predictions : res.data || [];
        const forId = list.filter((p) => (p.inverterId || p.inverter_id || p.id) === id);
        if (cancelled) return;
        setHistory(forId);
        const latest = forId.sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0))[0];
        setDetail(latest || { inverterId: id, riskScore: 0, topFeatures: [] });
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load');
        if (!cancelled) setDetail({ inverterId: id, riskScore: 72, topFeatures: ['Temperature variance', 'Voltage instability'] });
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading && !detail) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.wrap}>
        <header className="layout__header">
          <SkeletonLine width={200} height="1.5rem" />
        </header>
        <SkeletonCard />
      </motion.div>
    );
  }

  const score = detail?.riskScore ?? detail?.risk_score ?? detail?.score ?? 0;
  const level = getRiskLevel(score);
  const features = detail?.topFeatures || detail?.shap || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.wrap}>
      <header className="layout__header">
        <h1 className="layout__title">Inverter: {id}</h1>
        <Link to="/dashboard" className={styles.back}>← Dashboard</Link>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Risk score</span>
          <span className={`${styles.cardValue} ${styles[`risk-${level}`]}`}>{score}%</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Level</span>
          <span className={styles.badge} data-level={level}>{level}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Predictions in history</span>
          <span className={styles.cardValue}>{history.length}</span>
        </div>
      </div>

      {features.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Top contributing factors</h2>
          <ul className={styles.factorList}>
            {features.slice(0, 5).map((f, i) => (
              <li key={i}>{typeof f === 'string' ? f : (f.name || f.feature || `Factor ${i + 1}`)}</li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent history</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Risk score</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {(history.length ? history : [{ timestamp: new Date().toISOString(), riskScore: score }]).slice(0, 10).map((h, i) => (
                <tr key={i}>
                  <td>{new Date(h.timestamp || h.createdAt).toLocaleString()}</td>
                  <td className={styles[`risk-${getRiskLevel(h.riskScore ?? h.risk_score ?? 0)}`]}>{h.riskScore ?? h.risk_score ?? 0}%</td>
                  <td><span className={styles.badge} data-level={getRiskLevel(h.riskScore ?? h.risk_score ?? 0)}>{getRiskLevel(h.riskScore ?? h.risk_score ?? 0)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className={styles.actions}>
        <Link to={`/explain/${encodeURIComponent(id)}`} className={styles.primaryBtn}>AI Explanation</Link>
      </div>
    </motion.div>
  );
}
