import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { verifyEmail } from '../services/api';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing verification token.');
            return;
        }

        const verify = async () => {
            try {
                const res = await verifyEmail(token);
                if (res.data.success) {
                    setStatus('success');
                    setMessage('Your email has been successfully verified! You can now log in.');
                } else {
                    setStatus('error');
                    setMessage(res.data.message || 'Verification failed. The token may be invalid or expired.');
                }
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'An error occurred during verification.');
            }
        };

        verify();
    }, [token]);

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
            <div className="card animate-fade-in" style={{ width: '400px', padding: '2.5rem', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Email Verification</h2>

                <div style={{
                    padding: '1.5rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-sub-surface)',
                    border: `1px solid ${status === 'success' ? 'var(--status-low-risk)' : status === 'error' ? 'var(--status-high-risk)' : 'var(--border-color)'}`,
                    marginBottom: '2rem'
                }}>
                    <p style={{
                        color: status === 'success' ? 'var(--status-low-risk)' : status === 'error' ? 'var(--status-high-risk)' : 'var(--text-primary)',
                        marginBottom: 0
                    }}>
                        {message}
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            padding: '0.8rem 1.5rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--accent-primary)',
                            color: '#000',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default VerifyEmail;
