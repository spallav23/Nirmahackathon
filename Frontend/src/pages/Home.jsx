import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sun, Activity, ShieldCheck, Mail } from 'lucide-react';

const Home = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                width: '100vw',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)',
            }}
        >
            <header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1.5rem 3rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--accent-primary)', fontWeight: '700', fontSize: '1.5rem' }}>
                    <Sun size={28} /> AI Solar Platform
                </div>
                <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <Link to="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
                    <Link to="/about" style={{ color: 'var(--text-secondary)' }}>About</Link>
                    <Link to="/contact" style={{ color: 'var(--text-secondary)' }}>Contact</Link>
                    <Link to="/login" style={{
                        background: 'var(--accent-primary)', color: '#000', padding: '0.5rem 1.2rem',
                        borderRadius: '8px', fontWeight: '600'
                    }}>Login / Sign Up</Link>
                </nav>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' }}>
                <motion.h1
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(90deg, #00E5FF, #B388FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                    Predictive Intelligence for Solar Inverters
                </motion.h1>
                <motion.p
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '700px', marginBottom: '3rem' }}
                >
                    Harness the power of Machine Learning and LLMs to predict inverter failures 7-10 days in advance, empowering proactive maintenance and extending hardware lifespans.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    style={{ display: 'flex', gap: '2rem' }}
                >
                    <div className="card" style={{ width: '300px', textAlign: 'left', background: 'var(--bg-sub-surface)' }}>
                        <Activity size={32} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem' }}>Real-time Telemetry</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monitor voltage, temperature, and current deviations across your entire solar grid dynamically.</p>
                    </div>
                    <div className="card" style={{ width: '300px', textAlign: 'left', background: 'var(--bg-sub-surface)' }}>
                        <ShieldCheck size={32} color="var(--status-low-risk)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem' }}>Proactive Alerts</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Receive instant SMTP notifications via Kafka when an inverter surpasses safety thresholds.</p>
                    </div>
                    <div className="card" style={{ width: '300px', textAlign: 'left', background: 'var(--bg-sub-surface)' }}>
                        <Mail size={32} color="var(--accent-secondary)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem' }}>AI Explanations</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chat with our LLM interface to understand root causes powered by SHAP feature scoring.</p>
                    </div>
                </motion.div>
            </main>
        </motion.div >
    );
};

export default Home;
