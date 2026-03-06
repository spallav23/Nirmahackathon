import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getModels, trainModel, setActiveModel, getTrainProgress } from '../services/api';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState(null);
    const [training, setTraining] = useState(false);
    const [progressData, setProgressData] = useState({ progress: 0, message: '', status: 'idle' });
    const [message, setMessage] = useState({ text: '', type: '' });
    const pollInterval = useRef(null);

    useEffect(() => {
        fetchModels();
        return () => stopPolling(); // Cleanup on unmount
    }, []);

    const fetchModels = async () => {
        setLoading(true);
        try {
            const res = await getModels();
            if (res.data.success) {
                setModels(res.data.data.models || []);
            }
        } catch (err) {
            setMessage({ text: 'Failed to fetch models from ML server.', type: 'error' });
        }
        setLoading(false);
    };

    const handleSetActive = async (modelId) => {
        try {
            await setActiveModel(modelId);
            setMessage({ text: `Active model switched to ${modelId}.`, type: 'success' });
            fetchModels();
        } catch (err) {
            console.error(err);
            setMessage({ text: err.response?.data?.message || 'Failed to change active model.', type: 'error' });
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const startPolling = () => {
        if (pollInterval.current) return;
        pollInterval.current = setInterval(async () => {
            try {
                const res = await getTrainProgress();
                if (res.data.success) {
                    const data = res.data.data;
                    setProgressData(data);

                    if (data.status === 'completed') {
                        stopPolling();
                        setTraining(false);
                        const f1 = data.result?.metrics?.[0]?.F1 || 0;
                        setMessage({ text: `Training complete! Best model: ${data.result?.best_model}. F1 Score: ${f1.toFixed(3)}`, type: 'success' });
                        fetchModels(); // Refresh the list
                        setFile(null); // Clear input
                        setTimeout(() => setProgressData({ progress: 0, message: '', status: 'idle' }), 5000);
                    } else if (data.status === 'error') {
                        stopPolling();
                        setTraining(false);
                        setMessage({ text: data.message || 'Training failed.', type: 'error' });
                    }
                }
            } catch (err) {
                console.error("Progress polling error", err);
            }
        }, 2000);
    };

    const stopPolling = () => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    };

    const handleTrainSubmit = async (e, useExistingData = false) => {
        e.preventDefault();

        if (!useExistingData && !file) {
            setMessage({ text: 'Please select a dataset file (.csv or .xlsx) first.', type: 'error' });
            return;
        }

        setTraining(true);
        setMessage({ text: '', type: '' }); // Clear main message while polling handles info
        setProgressData({ progress: 0, message: 'Initiating training sequence...', status: 'started' });

        try {
            const formData = new FormData();
            if (!useExistingData) {
                formData.append('file', file);
            }

            const res = await trainModel(formData);
            if (res.data.success) {
                startPolling();
            }
        } catch (err) {
            setTraining(false);
            setMessage({ text: err.response?.data?.message || 'Failed to start training pipeline.', type: 'error' });
        }
    };

    if (user?.role !== 'admin') {
        return <div style={{ padding: '2rem', color: 'var(--status-high-risk)' }}>Access Denied. Admin privileges required.</div>;
    }

    if (loading) return <div style={{ padding: '2rem' }}>Loading Admin Console...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        >
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--accent-primary)' }}>System Admin Console</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage the AI Predictive Engine and view structural analytics.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '1000px' }}>

                {message.text && (
                    <div style={{
                        padding: '1rem', borderRadius: '8px',
                        backgroundColor: message.type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 76, 76, 0.1)',
                        color: message.type === 'success' ? 'var(--status-low-risk)' : 'var(--status-high-risk)'
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Training Panel */}
                <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0' }}>Trigger Live ML Training</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Upload a new historical dataset (CSV/Excel) containing `future_failure_7_10_days` labels, OR retrain using the existing master dataset. The python engine will train XGBoost/LightGBM/RandomForest concurrently, evaluate them, and serialize the models back to disk.
                    </p>

                    <form onSubmit={(e) => handleTrainSubmit(e, false)} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            onChange={handleFileChange}
                            disabled={training}
                            style={{
                                padding: '0.8rem', borderRadius: '8px',
                                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)',
                                color: 'var(--text-primary)', flex: 1
                            }}
                        />
                        <button
                            type="submit"
                            disabled={training || !file}
                            style={{
                                padding: '0.8rem 1.5rem', backgroundColor: 'var(--accent-primary)', color: '#000',
                                fontWeight: 'bold', borderRadius: '8px', opacity: (training || !file) ? 0.6 : 1,
                                cursor: (training || !file) ? 'not-allowed' : 'pointer', border: 'none', whiteSpace: 'nowrap'
                            }}
                        >
                            Upload & Train
                        </button>
                    </form>

                    <div style={{ display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <button
                            onClick={(e) => handleTrainSubmit(e, true)}
                            disabled={training}
                            style={{
                                padding: '0.6rem 1.2rem', backgroundColor: 'transparent',
                                color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)',
                                fontWeight: 'bold', borderRadius: '8px', opacity: training ? 0.6 : 1,
                                cursor: training ? 'not-allowed' : 'pointer', flexShrink: 0
                            }}
                        >
                            Retrain on Existing Data
                        </button>
                    </div>

                    {/* Progress Bar */}
                    {training && (
                        <div style={{ marginTop: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{progressData.message}</span>
                                <span>{progressData.progress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-sub-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressData.progress}%` }}
                                    transition={{ ease: "easeOut", duration: 0.5 }}
                                    style={{ height: '100%', backgroundColor: 'var(--accent-primary)' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Model Accuracy Table */}
                <div className="card">
                    <h3 style={{ margin: '0 0 1.5rem 0' }}>Available ML Models & Metrics</h3>
                    {models.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No models found on disk. Run a training session.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                        <th style={{ padding: '1rem 0.5rem' }}>Model Name</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Features</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>F1 Score</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>AUC</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Precision / Recall</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {models.map(m => (
                                        <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>{m.name}</td>
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                {m.active ? (
                                                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(0, 230, 118, 0.1)', color: 'var(--status-low-risk)', fontSize: '0.8rem', fontWeight: 'bold' }}>Active</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>Idle</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem' }}>{m.feature_count} </td>
                                            <td style={{ padding: '1rem 0.5rem', color: m.metrics?.f1 > 0.8 ? 'var(--status-low-risk)' : 'var(--text-primary)' }}>
                                                {m.metrics ? m.metrics.f1 : 'N/A'}
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem' }}>{m.metrics ? m.metrics.auc : 'N/A'}</td>
                                            <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>
                                                {m.metrics ? `${m.metrics.precision} / ${m.metrics.recall}` : 'N/A'}
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                {!m.active && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetActive(m.id)}
                                                        style={{
                                                            padding: '0.4rem 0.8rem',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--accent-primary)',
                                                            backgroundColor: 'transparent',
                                                            color: 'var(--accent-primary)',
                                                            fontSize: '0.8rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Use for Live Predictions
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                                Use the standard Settings portal to hot-swap the Active model used for live inference.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </motion.div>
    );
};

export default AdminDashboard;
