import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { runPrediction, getAISummary, getModels } from '../services/api';

const InverterDetail = () => {
    const [telemetry, setTelemetry] = useState({
        temperature: '',
        voltage: '',
        current: '',
        alarmFrequency: '',
        powerRatio: ''
    });

    const [prediction, setPrediction] = useState(null);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [models, setModels] = useState([]);
    const [selectedModelId, setSelectedModelId] = useState('');

    useEffect(() => {
        const loadModels = async () => {
            try {
                const res = await getModels();
                if (res.data.success) {
                    const list = res.data.data.models || [];
                    setModels(list);
                    const active = list.find(m => m.active);
                    if (active) setSelectedModelId(active.id);
                }
            } catch (err) {
                console.error('Failed to load models for prediction page', err);
            }
        };
        loadModels();
    }, []);

    const handleInputChange = (e) => {
        setTelemetry({ ...telemetry, [e.target.name]: e.target.value });
    };

    const handlePredict = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setPrediction(null);
        setSummary('');

        try {
            // 1. Run ML Prediction
            const predRes = await runPrediction({
                inverterId: 'INV-204',
                modelId: selectedModelId || undefined,
                telemetry: {
                    temperature: Number(telemetry.temperature),
                    voltage: Number(telemetry.voltage),
                    current: Number(telemetry.current),
                    alarm_frequency: telemetry.alarmFrequency ? Number(telemetry.alarmFrequency) : undefined,
                    power_ratio: telemetry.powerRatio ? Number(telemetry.powerRatio) : undefined
                }
            });

            if (predRes.data.success) {
                const predData = predRes.data.data;
                setPrediction(predData);

                // 2. Get AI Summary explanation
                try {
                    const summaryRes = await getAISummary({
                        predictionId: predData._id,
                        riskScore: predData.riskScore,
                        topFeatures: predData.topFeatures,
                        modelOutput: predData.modelOutput
                    });

                    if (summaryRes.data.success) {
                        setSummary(summaryRes.data.data.summary);
                    }
                } catch (summaryErr) {
                    // Fallback if summary fails
                    console.error("Summary Failed:", summaryErr);
                    setSummary("AI Explanation temporarily unavailable. Please refer to risk score and factors.");
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to generate prediction from ML server.');
        }

        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
        >
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem' }}>Inverter: INV-204</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Status: {prediction ? (
                            <span style={{ color: prediction.riskScore >= 70 ? 'var(--status-high-risk)' : prediction.riskScore >= 40 ? 'var(--status-medium-risk)' : 'var(--status-low-risk)', fontWeight: 'bold' }}>
                                Predicted Risk ({prediction.riskScore}%)
                            </span>
                        ) : 'Awaiting Telemetry'}
                    </p>
                </div>
                <button style={{ padding: '0.5rem 1rem', background: 'var(--bg-sub-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    Schedule Inspection
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* Manual Telemetry Input for Prediction Simulation */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>Submit Telemetry for Prediction</h3>
                    <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {models.length > 0 && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Model to use</label>
                                <select
                                    value={selectedModelId}
                                    onChange={(e) => setSelectedModelId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-sub-surface)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    {models.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} {m.active ? '(Active default)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Temperature (°C)</label>
                            <input
                                type="number" step="0.1" name="temperature" value={telemetry.temperature} onChange={handleInputChange} required placeholder="e.g. 45.2"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Voltage (V)</label>
                            <input
                                type="number" step="0.1" name="voltage" value={telemetry.voltage} onChange={handleInputChange} required placeholder="e.g. 220.5"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Current (A)</label>
                            <input
                                type="number" step="0.1" name="current" value={telemetry.current} onChange={handleInputChange} required placeholder="e.g. 15.4"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Alarm Frequency (last 7 days)</label>
                            <input
                                type="number" step="1" min="0" name="alarmFrequency" value={telemetry.alarmFrequency} onChange={handleInputChange} placeholder="e.g. 3"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Power Ratio</label>
                            <input
                                type="number" step="0.01" min="0" max="2" name="powerRatio" value={telemetry.powerRatio} onChange={handleInputChange} placeholder="e.g. 0.92"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <button
                            type="submit" disabled={loading}
                            style={{
                                padding: '1rem', marginTop: '1rem', backgroundColor: 'var(--accent-primary)', color: '#000',
                                fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: loading ? 'wait' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Analyzing Telemetry via ML...' : 'Run Diagnostics'}
                        </button>

                        {error && <p style={{ color: 'var(--status-high-risk)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{error}</p>}
                    </form>
                </div>

                {/* AI Explanation Result */}
                <div>
                    <div className="card" style={{ border: prediction ? `1px solid ${prediction.riskScore >= 70 ? 'var(--status-high-risk)' : 'var(--accent-primary)'}` : '1px solid var(--border-color)', backgroundColor: prediction ? 'rgba(0, 229, 255, 0.05)' : 'var(--bg-sub-surface)', minHeight: '100%' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: prediction ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                            AI Explanation Panel
                        </h3>

                        {!prediction && !loading && (
                            <p style={{ marginTop: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                Submit telemetry data to generate an AI risk analysis.
                            </p>
                        )}

                        {loading && (
                            <div style={{ marginTop: '2rem' }}>
                                <div className="skeleton" style={{ width: '100%', height: '20px', marginBottom: '0.5rem' }}></div>
                                <div className="skeleton" style={{ width: '80%', height: '20px', marginBottom: '2rem' }}></div>
                                <div className="skeleton" style={{ width: '60%', height: '15px', marginBottom: '0.5rem' }}></div>
                                <div className="skeleton" style={{ width: '50%', height: '15px' }}></div>
                            </div>
                        )}

                        {prediction && !loading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '8px', marginTop: '1.5rem', borderLeft: `4px solid ${prediction.riskScore >= 70 ? 'var(--status-high-risk)' : 'var(--status-low-risk)'}` }}>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Generative Root Cause Analysis:</h4>
                                    <p style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>
                                        {summary || "Generating summary..."}
                                    </p>
                                </div>

                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Top Contributing Factors (SHAP):</h4>
                                    {prediction.topFeatures && prediction.topFeatures.length > 0 ? (
                                        <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {prediction.topFeatures.map((feat, idx) => (
                                                <li key={idx}>
                                                    <span style={{ fontWeight: '500' }}>{feat.name}</span>
                                                    <span style={{ color: feat.value > 0 ? 'var(--status-high-risk)' : 'var(--status-low-risk)', marginLeft: '0.5rem' }}>
                                                        ({feat.value > 0 ? '+' : ''}{feat.value})
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No significant factors identified.</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default InverterDetail;
