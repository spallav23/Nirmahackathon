import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{
                minHeight: '100vh',
                backgroundColor: 'var(--bg-main)',
                padding: '4rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}
        >
            <div style={{ maxWidth: '800px', width: '100%' }}>
                <h1 style={{ fontSize: '3rem', color: 'var(--accent-primary)', marginBottom: '2rem' }}>About Us</h1>
                <div className="card" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: '1.8' }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        The AI-Driven Solar Inverter Platform is built to solve one of the energy industry's largest operational bottlenecks: unexpected hardware failures. Even highly efficient photovoltaic systems are prone to unpredictable downtime when critical components like inverters break.
                    </p>
                    <p style={{ marginBottom: '1.5rem' }}>
                        We leverage a microservices architecture to process massive streams of telemetry data. By deploying advanced Machine Learning models (XGBoost, RandomForest) and coupling it with LLM-powered RAG systems, we don't just predict whether a failure will occur—we tell you why.
                    </p>
                    <p>
                        Our core mission is to minimize carbon emission by ensuring green energy infrastructure hits maximum uptime potential, scaling seamlessly with modern event-driven containerization.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default About;
