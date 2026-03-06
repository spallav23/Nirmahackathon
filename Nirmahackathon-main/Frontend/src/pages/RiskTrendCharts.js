import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { predictions } from '../api/client';
import { SkeletonChart, SkeletonLine } from '../components/Skeleton';
import styles from '../styles/Trends.module.css';

const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

function getRiskLevel(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export default function RiskTrendCharts() {
  const [history, setHistory] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [topFactors, setTopFactors] = useState([]);
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
        if (cancelled) return;
        setHistory(list);
        const byDate = {};
        list.forEach((p) => {
          const ts = p.timestamp || p.createdAt || p.date;
          const date = ts ? new Date(ts).toLocaleDateString() : 'N/A';
          const score = p.riskScore ?? p.risk_score ?? p.score ?? 0;
          if (!byDate[date]) byDate[date] = { date, total: 0, count: 0, max: 0 };
          byDate[date].total += score;
          byDate[date].count += 1;
          if (score > byDate[date].max) byDate[date].max = score;
        });
        setTrendData(
          Object.values(byDate)
            .map((d) => ({ ...d, avg: d.count ? Math.round(d.total / d.count) : 0 }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        );
        const factors = (list[0] && list[0].topFeatures) || list[0]?.shap?.slice(0, 5) || getMockTopFactors();
        setTopFactors(Array.isArray(factors) ? factors : getMockTopFactors());
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load history');
        if (!cancelled) {
          setTrendData(getMockTrendData());
          setTopFactors(getMockTopFactors());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const factorChartData = topFactors.map((f, i) => ({
    name: typeof f === 'string' ? f : (f.name || f.feature || `Factor ${i + 1}`),
    value: typeof f === 'object' && f.value != null ? f.value : 80 - i * 12,
    fill: RISK_COLORS.high,
  }));

  if (loading && trendData.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.wrap}>
        <header className="layout__header">
          <h1 className="layout__title">Risk trend charts</h1>
        </header>
        <div className={styles.section}>
          <SkeletonLine width="40%" height="1.5rem" />
          <div className={styles.chartWrap}><SkeletonChart /></div>
        </div>
        <div className={styles.section}>
          <SkeletonLine width="35%" height="1.5rem" />
          <div className={styles.chartWrap}><SkeletonChart /></div>
        </div>
      </motion.div>
    );
  }

  const lineData = trendData.length ? trendData : getMockTrendData();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.wrap}>
      <header className="layout__header">
        <h1 className="layout__title">Risk trend charts</h1>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Historical risk trends</h2>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={lineData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                formatter={(value) => [`${value}%`, 'Risk']}
              />
              <Legend />
              <Area type="monotone" dataKey="avg" stroke="var(--accent)" fill="url(#riskGradient)" name="Avg risk score" strokeWidth={2} />
              <Line type="monotone" dataKey="max" stroke="var(--risk-high)" name="Max risk" strokeWidth={1.5} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Top failure factors</h2>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={factorChartData} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                formatter={(value) => [`${value}%`, 'Contribution']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {factorChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </motion.div>
  );
}

function getMockTrendData() {
  const d = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    d.push({
      date: date.toLocaleDateString(),
      avg: 35 + Math.random() * 35,
      max: 50 + Math.random() * 45,
    });
  }
  return d;
}

function getMockTopFactors() {
  return [
    { name: 'Temperature variance', value: 72 },
    { name: 'Voltage instability', value: 58 },
    { name: 'Current deviation', value: 45 },
    { name: 'Alarm frequency', value: 38 },
    { name: 'Power ratio', value: 28 },
  ];
}
