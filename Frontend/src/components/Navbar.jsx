import React from 'react';
import { User, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="app-navbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%', justifyContent: 'space-between' }}>
                {/* Mobile Logo View */}
                <div className="mobile-logo-only">
                    <h2 style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', fontWeight: '700', margin: 0 }}>
                        Solar Intelligence
                    </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto' }}>
                    <button style={{ position: 'relative', background: 'transparent', color: 'var(--text-secondary)' }}>
                        <Bell size={22} />
                        <span style={{
                            position: 'absolute', top: '-2px', right: '-2px',
                            width: '8px', height: '8px', borderRadius: '50%',
                            backgroundColor: 'var(--status-high-risk)'
                        }}></span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            backgroundColor: 'var(--bg-sub-surface)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
                        }}>
                            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
                        </div>
                        <div className="nav-user-details" style={{ marginRight: '1rem' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: '500', margin: 0 }}>{user?.name || 'Operator'}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{user?.email || 'admin'}</p>
                        </div>

                        <button
                            onClick={handleLogout}
                            style={{
                                background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                transition: 'color 0.2s', padding: '0.5rem', borderRadius: '6px'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.color = 'var(--status-high-risk)';
                                e.currentTarget.style.backgroundColor = 'rgba(255, 76, 76, 0.1)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.color = 'var(--text-secondary)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
