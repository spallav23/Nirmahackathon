import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, MessageSquare, Settings as SettingsIcon, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user } = useAuth();

    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Inverters', path: '/inverter/INV-204', icon: <Activity size={20} /> },
        { name: 'AI Operator Q&A', path: '/qna', icon: <MessageSquare size={20} /> },
        { name: 'Alerts', path: '/', icon: <AlertTriangle size={20} /> },
        { name: 'Settings', path: '/settings', icon: <SettingsIcon size={20} /> },
    ];

    if (user?.role === 'admin') {
        links.push({ name: 'Admin Console', path: '/admin', icon: <ShieldAlert size={20} /> });
    }

    return (
        <aside className="app-sidebar" style={{
            width: 'var(--sidebar-width)',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            backgroundColor: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 0'
        }}>
            <div className="sidebar-logo" style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
                <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', fontWeight: '700' }}>
                        Solar Intelligence
                    </h2>
                </NavLink>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem' }}>
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            padding: '0.8rem 1rem',
                            borderRadius: '8px',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            backgroundColor: isActive ? 'var(--bg-sub-surface)' : 'transparent',
                            fontWeight: isActive ? '600' : '400',
                            transition: 'all 0.2s'
                        })}
                    >
                        {link.icon}
                        <span className="nav-label">{link.name}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
