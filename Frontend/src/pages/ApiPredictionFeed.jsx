import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getApiPredictions, getApiKey } from '../services/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:80';

const RiskBadge = ({ score }) => {
    const color = score >= 70 ? 'var(--status-high-risk)' : score >= 40 ? 'var(--status-medium-risk)' : 'var(--status-low-risk)';
    const label = score >= 70 ? 'High Risk' : score >= 40 ? 'Medium Risk' : 'Low Risk';
    return (
        <span style={{
            padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem',
            fontWeight: 'bold', color, backgroundColor: `${color}22`, border: `1px solid ${color}`
        }}>{label} ({score}%)</span>
    );
};

const ApiPredictionFeed = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [maskedKey, setMaskedKey] = useState(null);
    const [copiedSnippet, setCopiedSnippet] = useState('');
    const [activeTab, setActiveTab] = useState('curl');

    const fetchRecords = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const res = await getApiPredictions(p);
            if (res.data.success) {
                const { records: recs, total: tot, totalPages: tp } = res.data.data;
                setRecords(recs);
                setTotal(tot);
                setTotalPages(tp);
            }
        } catch (err) {
            console.error('Failed to fetch API predictions', err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchRecords(page);
        getApiKey().then(res => {
            if (res.data.success && res.data.data.apiKey) {
                setMaskedKey(res.data.data.apiKey);
            }
        }).catch(() => { });
    }, [fetchRecords, page]);

    const curlSnippet = `curl -X POST ${BASE_URL}/api/api-key/predict \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "inverterId": "INV-1",
    "telemetry": {
      "inverter_power": 4523.5,
      "pv1_power": 2200.0,
      "energy_today": 18.5,
      "inverter_temp": 45.0,
      "grid_frequency": 50.02,
      "ambient_temperature": 32.0
    }
  }'`;

    const pythonSnippet = `import requests

API_KEY = "YOUR_API_KEY"
API_URL = "${BASE_URL}/api/api-key/predict"

payload = {
    "inverterId": "INV-1",
    "telemetry": {
        "inverter_power": 4523.5,
        "pv1_power": 2200.0,
        "energy_today": 18.5,
        "inverter_temp": 45.0,
        "grid_frequency": 50.02,
        "ambient_temperature": 32.0,
    }
}

response = requests.post(
    API_URL,
    json=payload,
    headers={"x-api-key": API_KEY}
)
result = response.json()
print(f"Risk Score: {result['data']['riskScore']}%")`;

    const snippets = { curl: curlSnippet, python: pythonSnippet };

    const copySnippet = (lang) => {
        navigator.clipboard.writeText(snippets[lang]);
        setCopiedSnippet(lang);
        setTimeout(() => setCopiedSnippet(''), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem' }}>API Prediction Feed</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    View all predictions submitted programmatically via your API key.
                    {maskedKey && <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Active key: <code>{maskedKey}</code></span>}
                </p>
            </header>

            {/* Integration Guide */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--accent-secondary)' }}>Integration Guide</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Send a POST request to the endpoint below with your API key to submit telemetry and receive an instant risk prediction.
                    Get your API key from <strong>Settings</strong>.
                </p>

                {/* Tab buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    {['curl', 'python'].map(lang => (
                        <button
                            key={lang}
                            onClick={() => setActiveTab(lang)}
                            style={{
                                padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                backgroundColor: activeTab === lang ? 'var(--accent-primary)' : 'var(--bg-sub-surface)',
                                color: activeTab === lang ? '#000' : 'var(--text-primary)',
                                fontWeight: activeTab === lang ? 'bold' : 'normal',
                                fontSize: '0.85rem'
                            }}
                        >
                            {lang.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative' }}>
                    <pre style={{
                        backgroundColor: 'var(--bg-main)', borderRadius: '8px', padding: '1rem',
                        fontSize: '0.8rem', color: 'var(--text-primary)', overflowX: 'auto',
                        border: '1px solid var(--border-color)', lineHeight: '1.6'
                    }}>
                        <code>{snippets[activeTab]}</code>
                    </pre>
                    <button
                        onClick={() => copySnippet(activeTab)}
                        style={{
                            position: 'absolute', top: '0.75rem', right: '0.75rem',
                            padding: '0.3rem 0.75rem', backgroundColor: 'var(--bg-sub-surface)',
                            color: copiedSnippet === activeTab ? 'var(--status-low-risk)' : 'var(--text-primary)',
                            border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem'
                        }}
                    >
                        {copiedSnippet === activeTab ? '✓ Copied' : 'Copy'}
                    </button>
                </div>
            </div>

            {/* Predictions Table */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>
                        Recent API Predictions
                        <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                            ({total} total)
                        </span>
                    </h3>
                    <button
                        onClick={() => fetchRecords(page)}
                        style={{ padding: '0.4rem 1rem', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        ↻ Refresh
                    </button>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '8px' }} />)}
                    </div>
                ) : records.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No API predictions yet.</p>
                        <p style={{ fontSize: '0.9rem' }}>Use the code snippet above to send your first prediction.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Inverter ID</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Risk Score</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Top Factor</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Submitted At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r, idx) => (
                                    <motion.tr
                                        key={r._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        style={{ borderBottom: '1px solid var(--border-color)' }}
                                    >
                                        <td style={{ padding: '0.75rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>{r.inverterId}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <RiskBadge score={r.riskScore} />
                                        </td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {r.topFeatures?.[0]?.name
                                                ? `${r.topFeatures[0].name} (${r.topFeatures[0].value > 0 ? '+' : ''}${Number(r.topFeatures[0].value).toFixed(2)})`
                                                : '—'}
                                        </td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {new Date(r.createdAt).toLocaleString()}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                        >← Prev</button>
                        <span style={{ padding: '0.4rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                        >Next →</button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ApiPredictionFeed;
