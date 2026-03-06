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
        <header style={{
            height: 'var(--navbar-height)',
            backgroundColor: 'var(--bg-main)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 10
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
                    <div style={{ marginRight: '1rem' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{user?.name || 'Operator'}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.email || 'admin'}</p>
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
        </header>
    );
};

export default Navbar;
