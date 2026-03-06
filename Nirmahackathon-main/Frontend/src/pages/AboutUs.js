import React from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/AboutUs.module.css';

export default function AboutUs() {
  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <header className="layout__header">
        <h1 className="layout__title">About Us</h1>
      </header>

      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>AI-Driven Solar Inverter Failure Prediction & Intelligence Platform</h2>
        <p className={styles.heroSubtitle}>
          We help solar plant operators predict inverter shutdowns and underperformance before they happen, with clear AI-powered explanations and actionable recommendations.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Our Mission</h3>
        <p className={styles.body}>
          Solar power plants depend on inverters to convert DC to AC. When an inverter fails or underperforms, the plant loses generation and revenue. Our platform uses <strong>machine learning</strong> to estimate the risk of failure in the next 7–10 days and <strong>generative AI</strong> to explain why an inverter is at risk and what operators should do—so you can act before energy is lost.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>What We Offer</h3>
        <ul className={styles.featureList}>
          <li>
            <span className={styles.featureIcon}>📊</span>
            <div>
              <strong>Predictive visibility</strong> — ML-based risk scores per inverter so you can prioritize maintenance.
            </div>
          </li>
          <li>
            <span className={styles.featureIcon}>💬</span>
            <div>
              <strong>Natural language insights</strong> — Root cause summaries and recommended actions in plain English.
            </div>
          </li>
          <li>
            <span className={styles.featureIcon}>🔍</span>
            <div>
              <strong>Operator Q&A</strong> — Ask questions like “Which inverters in Block B have high risk?” and get data-backed answers.
            </div>
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Technology</h3>
        <p className={styles.body}>
          The platform is built on a scalable microservices architecture: Node.js backend, Python ML and LLM services, Redis feature store, Kafka event bus, and MongoDB—all containerized with Docker and fronted by an NGINX gateway. The dashboard you’re using is a responsive React application with real-time risk visualizations and AI explanation panels.
        </p>
      </section>
    </motion.div>
  );
}
