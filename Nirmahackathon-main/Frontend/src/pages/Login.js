import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Login.module.css';

const tabVariants = {
  inactive: { opacity: 0.6 },
  active: { opacity: 1 },
};

const formVariants = {
  hidden: { opacity: 0 },
  visible: (i) => ({
    opacity: 1,
    transition: { delay: i * 0.06 },
  }),
};

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, demoLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, name: name || email });
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className={styles.brand}>
          <motion.div
            className={styles.iconWrap}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
          >
            <SunIcon />
          </motion.div>
          <h1 className={styles.title}>Inverter Prediction Platform</h1>
          <p className={styles.subtitle}>
            {mode === 'login' ? 'Sign in to access the operational dashboard' : 'Create an account to get started'}
          </p>
        </div>

        <div className={styles.tabs}>
          <motion.button
            type="button"
            className={mode === 'login' ? styles.tabActive : styles.tab}
            onClick={() => switchMode('login')}
            variants={tabVariants}
            animate={mode === 'login' ? 'active' : 'inactive'}
          >
            Login
          </motion.button>
          <motion.button
            type="button"
            className={mode === 'register' ? styles.tabActive : styles.tab}
            onClick={() => switchMode('register')}
            variants={tabVariants}
            animate={mode === 'register' ? 'active' : 'inactive'}
          >
            Sign up
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.label
                key="name"
                className={styles.label}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={styles.input}
                  autoComplete="name"
                />
              </motion.label>
            )}
          </AnimatePresence>

          <motion.label className={styles.label} custom={0} variants={formVariants} initial="hidden" animate="visible">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@plant.com"
              className={styles.input}
              required
              autoComplete="email"
            />
          </motion.label>

          <motion.label className={styles.label} custom={1} variants={formVariants} initial="hidden" animate="visible">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={styles.input}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </motion.label>

          <AnimatePresence>
            {error && (
              <motion.p
                className={styles.error}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            className={styles.submit}
            disabled={loading}
            whileHover={!loading ? { scale: 1.01 } : {}}
            whileTap={!loading ? { scale: 0.99 } : {}}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </motion.button>
        </form>

        <p className={styles.footer}>
          <button
            type="button"
            className={styles.demoBtn}
            onClick={() => {
              demoLogin();
              navigate('/dashboard', { replace: true });
            }}
          >
            Skip to dashboard (demo)
          </button>
        </p>
      </motion.div>
    </div>
  );
}
