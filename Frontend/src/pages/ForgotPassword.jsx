import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await forgotPassword(email);
            if (res.data.success) {
                setStatus('success');
                setMessage(res.data.message || 'If an account exists, a password reset link has been sent to the email address.');
            } else {
                setStatus('error');
                setMessage(res.data.message || 'Failed to request password reset.');
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'An error occurred while requesting the password reset.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                backgroundColor: 'var(--bg-main)',
                zIndex: 1000
            }}
        >
            <div className="card animate-fade-in" style={{ width: '400px', padding: '2.5rem' }}>
                <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', color: 'var(--accent-primary)' }}>Reset Password</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
                    Enter your email to receive a reset link
                </p>

                {status === 'success' ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--status-low-risk)', marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-sub-surface)', borderRadius: '8px', border: '1px solid var(--status-low-risk)' }}>
                            {message}
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', backgroundColor: 'var(--accent-primary)', color: '#000', fontWeight: '600', border: 'none', cursor: 'pointer', width: '100%' }}
                        >
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {status === 'error' && (
                            <div style={{ color: 'var(--status-high-risk)', fontSize: '0.9rem', textAlign: 'center' }}>
                                {message}
                            </div>
                        )}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="operator@solar.com"
                                style={{
                                    width: '100%', padding: '0.8rem', borderRadius: '8px',
                                    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)',
                                    color: 'var(--text-primary)', fontSize: '1rem'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            style={{
                                padding: '0.9rem', marginTop: '1rem', borderRadius: '8px', backgroundColor: 'var(--accent-primary)',
                                color: '#000', fontWeight: '600', fontSize: '1rem', transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1
                            }}
                        >
                            {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Remember your password?{' '}
                            <span
                                onClick={() => navigate('/login')}
                                style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}
                            >
                                Sign in
                            </span>
                        </p>
                    </form>
                )}
            </div>
        </motion.div>
    );
};

export default ForgotPassword;
