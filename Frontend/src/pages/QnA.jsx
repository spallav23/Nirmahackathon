import React from 'react';
import { motion } from 'framer-motion';

const QnA = () => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}
        >
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem' }}>Operator Query Interface (AI)</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Ask questions about inverter risks, maintenance docs, and historical failures.</p>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', backgroundColor: 'var(--bg-main)' }}>
                    <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'var(--bg-sub-surface)', padding: '1rem', borderRadius: '12px 12px 12px 0', maxWidth: '80%' }}>
                            <p>Welcome! How can I assist you with the solar inverter platform today?</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', marginBottom: '1.5rem', justifyContent: 'flex-end' }}>
                        <div style={{ background: 'var(--accent-primary)', color: '#000', padding: '1rem', borderRadius: '12px 12px 0 12px', maxWidth: '80%' }}>
                            <p>Which inverters in Block B have high risk this week?</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'var(--bg-sub-surface)', padding: '1rem', borderRadius: '12px 12px 12px 0', maxWidth: '80%' }}>
                            <div className="skeleton" style={{ width: '200px', height: '20px', marginBottom: '0.5rem' }}></div>
                            <div className="skeleton" style={{ width: '300px', height: '20px' }}></div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-surface)' }}>
                    <input
                        type="text"
                        placeholder="Type your question..."
                        style={{
                            flex: 1, padding: '0.8rem 1rem', borderRadius: '8px',
                            border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)',
                            color: 'var(--text-primary)', outline: 'none'
                        }}
                    />
                    <button style={{
                        padding: '0 1.5rem', background: 'var(--accent-primary)',
                        color: '#000', borderRadius: '8px', fontWeight: 'bold'
                    }}>
                        Send
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default QnA;
