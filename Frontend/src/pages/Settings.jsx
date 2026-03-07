import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, resendVerification, verifyEmailDev, getModels, setActiveModel, generateApiKey, getApiKey, revokeApiKey } from '../services/api';

const Settings = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Auth State
    const [isEmailVerified, setIsEmailVerified] = useState(true);
    const [verifying, setVerifying] = useState(false);

    // ML Server State
    const [mlModels, setMlModels] = useState([]);
    const [mlLoading, setMlLoading] = useState(false);
    const [mlMessage, setMlMessage] = useState({ text: '', type: '' });

    // API Key State
    const [maskedKey, setMaskedKey] = useState(null);
    const [newKeyReveal, setNewKeyReveal] = useState(null);
    const [apiKeyLoading, setApiKeyLoading] = useState(false);
    const [apiKeyMessage, setApiKeyMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getProfile();
            if (res.data.success) {
                const profile = res.data.data.profile;
                setFormData({
                    name: profile.name || '',
                    email: profile.email || '',
                    phone: profile.phone || ''
                });
                setIsEmailVerified(profile.isEmailVerified);
            }

            // Fetch Models
            const modelRes = await getModels();
            if (modelRes.data.success) {
                setMlModels(modelRes.data.data.models || []);
            }

            // Fetch masked API key
            try {
                const keyRes = await getApiKey();
                if (keyRes.data.success) setMaskedKey(keyRes.data.data.apiKey);
            } catch (_) { }
        } catch (err) {
            console.error(err);
            setMessage({ text: 'Failed to load settings data. Backend server might not be running.', type: 'error' });
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVerifyEmail = async () => {
        setVerifying(true);
        setMessage({ text: '', type: '' });
        try {
            const res = await resendVerification(formData.email);
            if (res.data.success) {
                setMessage({ text: 'Verification email sent! Please check your inbox.', type: 'success' });
            }
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Failed to send verification email', type: 'error' });
        }
        setVerifying(false);
    };

    const handleDevVerify = async () => {
        if (!window.confirm("Admin Bypass: Force verify this email without SMTP token?")) return;
        setVerifying(true);
        try {
            const res = await verifyEmailDev(formData.email);
            if (res.data.success) {
                setIsEmailVerified(true);
                const currentUserStr = localStorage.getItem('user');
                if (currentUserStr) {
                    const currentUser = JSON.parse(currentUserStr);
                    localStorage.setItem('user', JSON.stringify({ ...currentUser, isEmailVerified: true }));
                }
                setMessage({ text: 'Dev Mode: Email verified successfully!', type: 'success' });
            }
        } catch (err) {
            setMessage({ text: 'Dev verification failed.', type: 'error' });
        }
        setVerifying(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });
        try {
            const res = await updateProfile(formData);
            if (res.data.success) {
                setMessage({ text: 'Profile updated successfully', type: 'success' });
                const updatedProfile = res.data.data.profile;
                setIsEmailVerified(updatedProfile.isEmailVerified);
                const currentUserStr = localStorage.getItem('user');
                if (currentUserStr) {
                    const currentUser = JSON.parse(currentUserStr);
                    const updatedUser = { ...currentUser, name: updatedProfile.name, email: updatedProfile.email };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            }
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Failed to update profile', type: 'error' });
        }
        setSaving(false);
    };

    const handleActivateModel = async (modelId) => {
        setMlLoading(true);
        setMlMessage({ text: '', type: '' });
        try {
            const res = await setActiveModel(modelId);
            if (res.data.success) {
                setMlMessage({ text: 'Active ML model updated!', type: 'success' });
                // Re-fetch to update active flag
                const modelRes = await getModels();
                if (modelRes.data.success) setMlModels(modelRes.data.data.models);
            }
        } catch (err) {
            setMlMessage({ text: 'Failed to update ML model. Is the Python server running?', type: 'error' });
        }
        setMlLoading(false);
    };

    const handleGenerateKey = async () => {
        if (maskedKey && !window.confirm('This will revoke your existing key. Continue?')) return;
        setApiKeyLoading(true);
        setApiKeyMessage({ text: '', type: '' });
        setNewKeyReveal(null);
        try {
            const res = await generateApiKey();
            if (res.data.success) {
                setNewKeyReveal(res.data.data.apiKey);
                setMaskedKey(res.data.data.apiKey.substring(0, 8) + '••••••••••••••••••••' + res.data.data.apiKey.slice(-4));
                setApiKeyMessage({ text: 'New API key generated! Copy it now — it will not be shown again.', type: 'success' });
            }
        } catch (err) {
            setApiKeyMessage({ text: err.response?.data?.message || 'Failed to generate key.', type: 'error' });
        }
        setApiKeyLoading(false);
    };

    const handleRevokeKey = async () => {
        if (!window.confirm('Revoke your API key? Any integrations using it will stop working.')) return;
        setApiKeyLoading(true);
        try {
            await revokeApiKey();
            setMaskedKey(null);
            setNewKeyReveal(null);
            setApiKeyMessage({ text: 'API key revoked.', type: 'success' });
        } catch (err) {
            setApiKeyMessage({ text: 'Failed to revoke key.', type: 'error' });
        }
        setApiKeyLoading(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setApiKeyMessage({ text: 'Copied to clipboard!', type: 'success' });
        setTimeout(() => setApiKeyMessage({ text: '', type: '' }), 2000);
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading settings...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        >
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem' }}>Settings</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your profile and platform preferences.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '2rem' }}>

                {/* Profile Settings Card */}
                <div className="card" style={{ alignSelf: 'start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--accent-primary)', margin: 0 }}>Profile Information</h3>
                        {!isEmailVerified && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--status-medium-risk)', fontWeight: 'bold' }}>Unverified</span>
                                <button
                                    onClick={handleVerifyEmail} disabled={verifying}
                                    style={{
                                        padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px',
                                        backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)', cursor: verifying ? 'wait' : 'pointer'
                                    }}
                                >
                                    {verifying ? 'Sending...' : 'Send Link'}
                                </button>
                                <button
                                    onClick={handleDevVerify} disabled={verifying} title="Dev bypass: Instantly verify without email"
                                    style={{
                                        padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px',
                                        backgroundColor: 'var(--status-medium-risk)', color: '#000', border: 'none',
                                        cursor: verifying ? 'wait' : 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    Dev ByPass
                                </button>
                            </div>
                        )}
                    </div>

                    {message.text && (
                        <div style={{
                            padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px',
                            backgroundColor: message.type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 76, 76, 0.1)',
                            color: message.type === 'success' ? 'var(--status-low-risk)' : 'var(--status-high-risk)'
                        }}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
                            <input
                                type="text" name="name" value={formData.name} onChange={handleChange} required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
                            <input
                                type="email" name="email" value={formData.email} onChange={handleChange} required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                            <input
                                type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="0"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <button
                            type="submit" disabled={saving}
                            style={{
                                padding: '0.9rem', backgroundColor: 'var(--accent-primary)', color: '#000',
                                fontWeight: 'bold', borderRadius: '8px', marginTop: '1rem',
                                opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Machine Learning Config Card */}
                <div className="card" style={{ alignSelf: 'start' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--accent-primary)', margin: 0 }}>Predictive AI Engine</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            Switch the active machine learning model used in live inference scoring.
                        </p>
                    </div>

                    {mlMessage.text && (
                        <div style={{
                            padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px',
                            backgroundColor: mlMessage.type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 76, 76, 0.1)',
                            color: mlMessage.type === 'success' ? 'var(--status-low-risk)' : 'var(--status-high-risk)'
                        }}>
                            {mlMessage.text}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {mlModels.length === 0 ? (
                            <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                                No trained models found. Run predictive training on the ML Server first.
                            </div>
                        ) : (
                            mlModels.map(model => (
                                <div key={model.id} style={{
                                    padding: '1.2rem', borderRadius: '8px',
                                    border: `1px solid ${model.active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                    backgroundColor: model.active ? 'rgba(0, 230, 118, 0.05)' : 'var(--bg-sub-surface)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: model.active ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                            {model.name}
                                        </h4>
                                        <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Features Expected: {model.feature_count}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleActivateModel(model.id)}
                                        disabled={mlLoading || model.active}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', fontWeight: 'bold',
                                            backgroundColor: model.active ? 'transparent' : 'var(--border-color)',
                                            color: model.active ? 'var(--accent-primary)' : 'var(--text-primary)',
                                            cursor: model.active || mlLoading ? 'default' : 'pointer'
                                        }}
                                    >
                                        {model.active ? 'Active' : 'Select'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* API Key Management Card — full width below */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ color: 'var(--accent-primary)', margin: 0 }}>API Key</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                            Use this key to push telemetry directly from your systems or IoT devices. Requires email verification.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleGenerateKey}
                            disabled={apiKeyLoading || !isEmailVerified}
                            title={!isEmailVerified ? 'Verify email first' : ''}
                            style={{
                                padding: '0.6rem 1.2rem', backgroundColor: 'var(--accent-primary)', color: '#000',
                                fontWeight: 'bold', borderRadius: '8px', border: 'none',
                                cursor: apiKeyLoading || !isEmailVerified ? 'not-allowed' : 'pointer',
                                opacity: apiKeyLoading || !isEmailVerified ? 0.5 : 1
                            }}
                        >
                            {maskedKey ? 'Regenerate' : 'Generate Key'}
                        </button>
                        {maskedKey && (
                            <button
                                onClick={handleRevokeKey}
                                disabled={apiKeyLoading}
                                style={{
                                    padding: '0.6rem 1.2rem', backgroundColor: 'transparent',
                                    color: 'var(--status-high-risk)', fontWeight: 'bold', borderRadius: '8px',
                                    border: '1px solid var(--status-high-risk)', cursor: 'pointer'
                                }}
                            >
                                Revoke
                            </button>
                        )}
                    </div>
                </div>

                {apiKeyMessage.text && (
                    <div style={{
                        padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '8px',
                        backgroundColor: apiKeyMessage.type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 76, 76, 0.1)',
                        color: apiKeyMessage.type === 'success' ? 'var(--status-low-risk)' : 'var(--status-high-risk)',
                        fontSize: '0.9rem'
                    }}>
                        {apiKeyMessage.text}
                    </div>
                )}

                {!isEmailVerified && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(255, 165, 0, 0.1)', color: 'var(--status-medium-risk)', fontSize: '0.9rem' }}>
                        ⚠ Please verify your email address to generate or use an API key.
                    </div>
                )}

                {newKeyReveal && (
                    <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--accent-primary)', marginTop: '0.5rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--status-medium-risk)', marginBottom: '0.5rem' }}>
                            ⚠ Copy this key now — it will not be shown again!
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <code style={{ flex: 1, padding: '0.6rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-all', overflowX: 'auto' }}>
                                {newKeyReveal}
                            </code>
                            <button
                                onClick={() => copyToClipboard(newKeyReveal)}
                                style={{ padding: '0.6rem 1rem', backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                )}

                {maskedKey && !newKeyReveal && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                        <code style={{ flex: 1, padding: '0.6rem', backgroundColor: 'var(--bg-main)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                            {maskedKey}
                        </code>
                    </div>
                )}

                {!maskedKey && !newKeyReveal && isEmailVerified && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>No API key generated yet. Click "Generate Key" to create one.</p>
                )}
            </div>
        </motion.div>
    );
};

export default Settings;
