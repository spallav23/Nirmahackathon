import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, resendVerification } from '../services/api';

const Settings = () => {
    const { user, login } = useAuth(); // login function not used, but Context is accessed
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isEmailVerified, setIsEmailVerified] = useState(true);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
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
        } catch (err) {
            console.error(err);
            setMessage({ text: 'Failed to load profile', type: 'error' });
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
            console.error(err);
            setMessage({ text: err.response?.data?.message || 'Failed to update profile', type: 'error' });
        }
        setSaving(false);
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading profile...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        >
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem' }}>Settings</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your profile and preferences.</p>
            </header>

            <div className="card" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--accent-primary)', margin: 0 }}>Profile Information</h3>
                    {!isEmailVerified && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--status-medium-risk)', fontWeight: 'bold' }}>Unverified Email</span>
                            <button
                                onClick={handleVerifyEmail}
                                disabled={verifying}
                                style={{
                                    padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px',
                                    backgroundColor: 'var(--bg-sub-surface)', color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)', cursor: verifying ? 'wait' : 'pointer'
                                }}
                            >
                                {verifying ? 'Sending...' : 'Verify Email'}
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
        </motion.div>
    );
};

export default Settings;
