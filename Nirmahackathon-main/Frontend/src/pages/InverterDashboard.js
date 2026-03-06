import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { predictions, models } from '../api/client';
import { SkeletonCard, SkeletonChart, SkeletonTable } from '../components/Skeleton';
import styles from '../styles/Dashboard.module.css';

const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

function getRiskLevel(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export default function InverterDashboard() {
  const [inverters, setInverters] = useState([]);
  const [history, setHistory] = useState([]);
  const [modelList, setModelList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [historyRes, modelsRes] = await Promise.all([
          predictions.history().catch(() => ({ predictions: [] })),
          models.list().catch(() => ({ models: [] })),
        ]);
        if (cancelled) return;
        const list = Array.isArray(historyRes.predictions) ? historyRes.predictions : historyRes.data || [];
        const hist = list.slice(0, 20);
        setHistory(hist);
        const byInverter = {};
        hist.forEach((p) => {
          const id = p.inverterId || p.inverter_id || p.id || 'INV-unknown';
          if (!byInverter[id]) byInverter[id] = { id, latestScore: 0, count: 0 };
          const score = p.riskScore ?? p.risk_score ?? p.score ?? 0;
          if (score > byInverter[id].latestScore) byInverter[id].latestScore = score;
          byInverter[id].count += 1;
        });
        setInverters(Object.values(byInverter).sort((a, b) => b.latestScore - a.latestScore));
        setModelList(Array.isArray(modelsRes.models) ? modelsRes.models : modelsRes.data || []);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load data');
        if (!cancelled) setInverters(getMockInverters());
        if (!cancelled) setHistory(getMockHistory());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const chartData = inverters.slice(0, 10).map((i) => ({
    name: i.id,
    score: i.latestScore,
    fill: RISK_COLORS[getRiskLevel(i.latestScore)] || RISK_COLORS.medium,
  }));

  if (loading && inverters.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.wrap}>
        <header className="layout__header">
          <h1 className="layout__title">Inverter Dashboard</h1>
        </header>
        <div className={styles.grid}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className={styles.chartWrap}>
          <SkeletonChart />
        </div>
        <div className={styles.tableWrap}>
          <SkeletonTable rows={6} cols={4} />
        </div>
      </motion.div>
    );
  }

  const topRisks = inverters.filter((i) => i.latestScore >= 50).slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.wrap}>
      <header className="layout__header">
        <h1 className="layout__title">Inverter Dashboard</h1>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Total Inverters</span>
          <span className={styles.cardValue}>{inverters.length || 0}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>High Risk</span>
          <span className={`${styles.cardValue} risk-high`}>{inverters.filter((i) => getRiskLevel(i.latestScore) === 'high').length}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Models Available</span>
          <span className={styles.cardValue}>{modelList.length || 0}</span>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Risk score per inverter</h2>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                labelStyle={{ color: 'var(--text-primary)' }}
                formatter={(value) => [`${value}%`, 'Risk score']}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Inverter list</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Inverter ID</th>
                <th>Latest risk score</th>
                <th>Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(inverters.length ? inverters : getMockInverters()).map((inv) => (
                <tr key={inv.id}>
                  <td><strong>{inv.id}</strong></td>
                  <td className={styles[`risk-${getRiskLevel(inv.latestScore)}`]}>{inv.latestScore}%</td>
                  <td><span className={styles.badge} data-level={getRiskLevel(inv.latestScore)}>{getRiskLevel(inv.latestScore)}</span></td>
                  <td>
                    <Link to={`/inverter/${encodeURIComponent(inv.id)}`} className={styles.link}>Detail</Link>
                    {' · '}
                    <Link to={`/explain/${encodeURIComponent(inv.id)}`} className={styles.link}>Explain</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {topRisks.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Top failure risk</h2>
          <ul className={styles.topList}>
            {topRisks.map((inv) => (
              <li key={inv.id}>
                <Link to={`/inverter/${encodeURIComponent(inv.id)}`}>{inv.id}</Link>
                <span className={`${styles.riskBadge} risk-high`}>{inv.latestScore}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </motion.div>
  );
}

function getMockInverters() {
  return [
    { id: 'INV-201', latestScore: 78, count: 1 },
    { id: 'INV-202', latestScore: 65, count: 1 },
    { id: 'INV-203', latestScore: 42, count: 1 },
    { id: 'INV-204', latestScore: 88, count: 1 },
    { id: 'INV-205', latestScore: 25, count: 1 },
  ];
}

function getMockHistory() {
  return getMockInverters().map((i) => ({ inverterId: i.id, riskScore: i.latestScore, timestamp: new Date().toISOString() }));
}
