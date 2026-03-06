import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    BarChart, Bar
} from 'recharts';
import { getAnalytics } from '../services/api';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, highRisk: 0, mediumRisk: 0 });
    const [trendData, setTrendData] = useState([]);
    const [failureFactors, setFailureFactors] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await getAnalytics();
            if (res.data.success) {
                const data = res.data.data;

                // Update Stats
                setStats({
                    total: data.totalPredictions || 0,
                    highRisk: data.riskDistribution?.highRisk || 0,
                    mediumRisk: data.riskDistribution?.mediumRisk || 0
                });

                // Format Factors for chart (backend groups by name & totalContribution)
                const formattedFactors = (data.topFactors || []).map(f => ({
                    name: f.name, value: f.totalContribution
                }));
                setFailureFactors(formattedFactors);

                // Format Trends for chart (backend returns date & avgRisk)
                const formattedTrends = (data.timeSeries || []).map(t => ({
                    name: t.date, risk: t.avgRisk
                }));
                setTrendData(formattedTrends);
            }
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        }
        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem' }}>Inverter Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Overview of all inverters and risk assessments.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Total Inverters Processed</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{stats.total}</p>
                </div>
                <div className="card animate-fade-in" style={{ borderLeft: '4px solid var(--status-high-risk)', animationDelay: '0.2s' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>High Risk Predictions</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--status-high-risk)' }}>{stats.highRisk}</p>
                </div>
                <div className="card animate-fade-in" style={{ borderLeft: '4px solid var(--status-medium-risk)', animationDelay: '0.3s' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Medium Risk</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--status-medium-risk)' }}>{stats.mediumRisk}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Historical Risk Trends</h3>
                    {loading ? (
                        <div className="skeleton" style={{ width: '100%', height: '300px' }}></div>
                    ) : trendData.length === 0 ? (
                        <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            No data available
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--status-high-risk)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--status-high-risk)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                    />
                                    <Area type="monotone" dataKey="risk" stroke="var(--status-high-risk)" fillOpacity={1} fill="url(#colorRisk)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="card animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Top Failure Factors</h3>
                    {loading ? (
                        <div className="skeleton" style={{ width: '100%', height: '300px' }}></div>
                    ) : failureFactors.length === 0 ? (
                        <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            No data available
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={failureFactors} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                                    <XAxis type="number" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                                    <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={120} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--bg-sub-surface)' }}
                                        contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" fill="var(--accent-primary)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
