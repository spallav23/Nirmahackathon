import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, MessageSquare, Settings as SettingsIcon, AlertTriangle, ShieldAlert, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user } = useAuth();

    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Inverters', path: '/inverter', icon: <Activity size={20} /> },
        { name: 'AI Operator Q&A', path: '/qna', icon: <MessageSquare size={20} /> },
        { name: 'Alerts', path: '/alerts', icon: <AlertTriangle size={20} /> },
        { name: 'API Feed', path: '/api-feed', icon: <Key size={20} /> },
        { name: 'Settings', path: '/settings', icon: <SettingsIcon size={20} /> },
    ];

    if (user?.role === 'admin') {
        links.push({ name: 'Admin Console', path: '/admin', icon: <ShieldAlert size={20} /> });
    }

    return (
        <aside className="app-sidebar">
            <div className="sidebar-logo">
                <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', fontWeight: '700' }}>
                        Solar Intelligence
                    </h2>
                </NavLink>
            </div>

            <nav className="sidebar-nav">
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
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
