import React from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/Skeleton.module.css';

const shimmer = {
  initial: { opacity: 0.5 },
  animate: { opacity: [0.5, 0.8, 0.5] },
  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
};

export function SkeletonLine({ width = '100%', height = '1rem', className = '' }) {
  return (
    <motion.div
      className={`${styles.line} ${className}`}
      style={{ width, height }}
      {...shimmer}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <motion.div className={`${styles.card} ${className}`} {...shimmer}>
      <div className={styles.cardLine} style={{ width: '60%', height: '1.25rem' }} />
      <div className={styles.cardLine} style={{ width: '90%', height: '0.875rem' }} />
      <div className={styles.cardLine} style={{ width: '70%', height: '0.875rem' }} />
    </motion.div>
  );
}

export function SkeletonChart({ className = '' }) {
  return (
    <motion.div className={`${styles.chart} ${className}`} {...shimmer}>
      <div className={styles.bar} style={{ height: '40%' }} />
      <div className={styles.bar} style={{ height: '65%' }} />
      <div className={styles.bar} style={{ height: '50%' }} />
      <div className={styles.bar} style={{ height: '80%' }} />
      <div className={styles.bar} style={{ height: '55%' }} />
    </motion.div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <motion.div className={`${styles.table} ${className}`} {...shimmer}>
      <div className={styles.tableRow}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={styles.tableCell} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.tableRow}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={styles.tableCell} />
          ))}
        </div>
      ))}
    </motion.div>
  );
}

export default { SkeletonLine, SkeletonCard, SkeletonChart, SkeletonTable };
