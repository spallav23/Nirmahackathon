import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="layout__sidebar">
        <div className="layout__brand">
          <span className="layout__brandText">Inverter Platform</span>
        </div>
        <nav>
          <ul className="layout__nav">
            <li><NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>Dashboard</NavLink></li>
            <li><NavLink to="/trends" className={({ isActive }) => (isActive ? 'active' : '')}>Risk Trends</NavLink></li>
            <li><NavLink to="/query" className={({ isActive }) => (isActive ? 'active' : '')}>Operator Q&A</NavLink></li>
            <li><NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>About Us</NavLink></li>
            <li><NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>Contact Us</NavLink></li>
          </ul>
        </nav>
        <div className="layout__user">
          <span className="layout__userName">{user?.name || user?.email || 'Operator'}</span>
          <button type="button" onClick={handleLogout} className="layout__logout">Logout</button>
        </div>
      </aside>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  );
}
