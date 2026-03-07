import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Activity, ArrowRight, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLatestPerInverter } from '../services/api';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await getLatestPerInverter();
                if (res.data.success) {
                    // Filter for inverters with a high risk score (> 50%) just for alerts
                    // or just show all of them if that's preferred, but an 'Alert' usually implies > 50%
                    const highRisk = res.data.data.inverters.filter(inv => inv.riskScore >= 50);
                    setAlerts(highRisk);
                } else {
                    setError('Failed to fetch alerts.');
                }
            } catch (err) {
                console.error('Error fetching alerts:', err);
                setError('Error fetching alerts.');
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, []);

    const getRiskColor = (score) => {
        if (score >= 80) return 'var(--status-high-risk)';
        if (score >= 50) return 'var(--status-medium-risk)';
        return 'var(--status-low-risk)';
    };

    if (loading) {
        return (
            <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Loading alerts...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                <p style={{ color: 'var(--status-high-risk)' }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: 'rgba(255, 61, 113, 0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: 'var(--status-high-risk)'
                }}>
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>
                        Active Alerts
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Inverters requiring immediate attention
                    </p>
                </div>
            </div>

            {alerts.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        padding: '3rem',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        backgroundColor: 'rgba(0, 229, 255, 0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                        color: 'var(--accent-primary)'
                    }}>
                        <ShieldAlert size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>All Systems Healthy</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>No high-risk inverters detected at this time.</p>
                </motion.div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {alerts.map((alert, index) => (
                        <motion.div
                            key={alert.inverterId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                border: `1px solid ${getRiskColor(alert.riskScore)}`,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Subtle background glow based on risk */}
                            <div style={{
                                position: 'absolute', top: 0, right: 0, width: '150px', height: '150px',
                                background: `radial-gradient(circle at top right, ${getRiskColor(alert.riskScore)}22, transparent)`,
                                zIndex: 0, pointerEvents: 'none'
                            }}></div>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                                            Inverter {alert.inverterId}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            <Clock size={14} />
                                            <span>
                                                {new Date(alert.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{
                                        backgroundColor: `${getRiskColor(alert.riskScore)}22`,
                                        color: getRiskColor(alert.riskScore),
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '20px',
                                        fontWeight: '700',
                                        fontSize: '0.9rem'
                                    }}>
                                        {alert.riskScore}% Risk
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: 'var(--bg-sub-surface)',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1.5rem',
                                    borderLeft: `3px solid ${getRiskColor(alert.riskScore)}`
                                }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Activity size={14} /> Critical Factors
                                    </h4>
                                    <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                        {alert.topFeatures && alert.topFeatures.slice(0, 2).map((feature, i) => (
                                            <li key={i} style={{ marginBottom: '0.3rem' }}>
                                                {feature.name.replace(/_/g, ' ')}
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>(+{feature.value.toFixed(2)})</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => navigate(`/inverter/${alert.inverterId}`)}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        backgroundColor: 'transparent',
                                        border: `1px solid ${getRiskColor(alert.riskScore)}`,
                                        color: getRiskColor(alert.riskScore),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.backgroundColor = `${getRiskColor(alert.riskScore)}11`;
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    Investigate Diagnostics
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Alerts;
