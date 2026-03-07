import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { resetPassword } from '../services/api';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            setStatus('error');
            setMessage('Missing reset token. Please use the link from your email.');
            return;
        }

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setStatus('error');
            setMessage('Password must be at least 8 characters long.');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const res = await resetPassword(token, password);
            if (res.data.success) {
                setStatus('success');
                setMessage('Your password has been successfully reset.');
            } else {
                setStatus('error');
                setMessage(res.data.message || 'Failed to reset password.');
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'An error occurred while resetting your password.');
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
                <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', color: 'var(--accent-primary)' }}>Create New Password</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
                    Enter your new password below
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
                            Log in with new password
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>New Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%', padding: '0.8rem', borderRadius: '8px',
                                    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)',
                                    color: 'var(--text-primary)', fontSize: '1rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Confirm Password</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
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
                            {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </motion.div>
    );
};

export default ResetPassword;
