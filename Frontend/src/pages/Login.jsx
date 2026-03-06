import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        let res;
        if (isLogin) {
            res = await login(email, password);
        } else {
            res = await register(name, email, password);
        }

        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.message);
        }
        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', color: 'var(--accent-primary)' }}>AI Inverter Platform</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
                    {isLogin ? 'Sign in to continue' : 'Create an operator account'}
                </p>

                {error && (
                    <div style={{ color: 'var(--status-high-risk)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {!isLogin && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                style={{
                                    width: '100%', padding: '0.8rem', borderRadius: '8px',
                                    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)',
                                    color: 'var(--text-primary)', fontSize: '1rem'
                                }}
                            />
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
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
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
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0.9rem',
                            marginTop: '1rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--accent-primary)',
                            color: '#000',
                            fontWeight: '600',
                            fontSize: '1rem',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                        onMouseOver={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(0, 229, 255, 0.3)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }
                        }}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}
                        onMouseOver={e => e.target.style.textDecoration = 'underline'}
                        onMouseOut={e => e.target.style.textDecoration = 'none'}
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </span>
                </p>

            </div>
        </motion.div>
    );
};

export default Login;
