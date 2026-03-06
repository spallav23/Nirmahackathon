import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/ContactUs.module.css';

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <header className="layout__header">
        <h1 className="layout__title">Contact Us</h1>
      </header>

      <div className={styles.grid}>
        <section className={styles.info}>
          <h3 className={styles.sectionTitle}>Get in touch</h3>
          <p className={styles.body}>
            Have questions about the platform, need support, or want to discuss deployment? Reach out and we’ll get back to you.
          </p>
          <ul className={styles.contactList}>
            <li>
              <span className={styles.label}>Email</span>
              <a href="mailto:support@inverterplatform.com">support@inverterplatform.com</a>
            </li>
            <li>
              <span className={styles.label}>Product &amp; sales</span>
              <a href="mailto:hello@inverterplatform.com">hello@inverterplatform.com</a>
            </li>
          </ul>
        </section>

        <section className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Send a message</h3>
          {submitted ? (
            <div className={styles.success}>
              <span className={styles.successIcon}>✓</span>
              <p>Thank you. We’ve received your message and will respond shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <label className={styles.label}>
                Name
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className={styles.input}
                  required
                />
              </label>
              <label className={styles.label}>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className={styles.input}
                  required
                />
              </label>
              <label className={styles.label}>
                Subject
                <select name="subject" value={form.subject} onChange={handleChange} className={styles.input} required>
                  <option value="">Select...</option>
                  <option value="support">Technical support</option>
                  <option value="sales">Sales / demo</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className={styles.label}>
                Message
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Your message..."
                  className={styles.textarea}
                  rows={4}
                  required
                />
              </label>
              <button type="submit" className={styles.submit}>Send message</button>
            </form>
          )}
        </section>
      </div>
    </motion.div>
  );
}
