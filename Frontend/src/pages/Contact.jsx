import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Contact = () => {
    const [sent, setSent] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{
                minHeight: '100vh',
                backgroundColor: 'var(--bg-main)',
                padding: '4rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}
        >
            <div style={{ maxWidth: '600px', width: '100%' }}>
                <h1 style={{ fontSize: '3rem', color: 'var(--accent-secondary)', marginBottom: '1rem' }}>Contact Us</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Have questions about our enterprise SLAs or AI platform? Send us a message.</p>

                {sent ? (
                    <div className="card" style={{ textAlign: 'center', borderColor: 'var(--status-low-risk)' }}>
                        <h3 style={{ color: 'var(--status-low-risk)', marginBottom: '1rem' }}>Message Sent Successfully!</h3>
                        <p>Our operation support team will reach out to you within 24 hours.</p>
                    </div>
                ) : (
                    <form
                        className="card"
                        style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
                        onSubmit={(e) => { e.preventDefault(); setSent(true); }}
                    >
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
                            <input type="text" required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                            <input type="email" required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Message</label>
                            <textarea rows="4" required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)', resize: 'none' }}></textarea>
                        </div>
                        <button type="submit" style={{ padding: '0.9rem', backgroundColor: 'var(--accent-secondary)', color: '#000', fontWeight: 'bold', borderRadius: '8px', marginTop: '0.5rem' }}>Send Message</button>
                    </form>
                )}
            </div>
        </motion.div>
    );
};

export default Contact;
