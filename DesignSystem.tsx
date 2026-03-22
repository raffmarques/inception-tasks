import React from 'react';
import styles from './DesignSystem.module.css';

/**
 * DesignSystem Page
 * Use this page to preview and tweak global styles, 
 * typography, and reusable components.
 */
const DesignSystem: React.FC = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Design System</h1>
        <p>Global styles and reusable UI components for the Personal Task Manager.</p>
      </header>

      {/* Typography Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Typography</h2>
        <div className={styles.card}>
          <h1 className={styles.display1}>Heading 1 (Display)</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <p className={styles.bodyText}>
            Body Text: Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Vivamus lacinia odio vitae vestibulum vestibulum.
          </p>
          <p className={styles.smallText}>Small/Caption Text: Used for metadata or helper info.</p>
        </div>
      </section>

      {/* Colors Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Color Palette</h2>
        <div className={styles.colorGrid}>
          <div className={styles.colorItem}>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--primary-color)' }}></div>
            <span>Primary</span>
          </div>
          <div className={styles.colorItem}>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--secondary-color)' }}></div>
            <span>Secondary</span>
          </div>
          <div className={styles.colorItem}>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--accent-color)' }}></div>
            <span>Accent</span>
          </div>
          <div className={styles.colorItem}>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--error-color)' }}></div>
            <span>Error</span>
          </div>
        </div>
      </section>

      {/* Buttons Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Buttons</h2>
        <div className={styles.card}>
          <div className={styles.buttonGroup}>
            <button className={styles.btnPrimary}>Primary Action</button>
            <button className={styles.btnSecondary}>Secondary Action</button>
            <button className={styles.btnOutline}>Outline Button</button>
            <button className={styles.btnGhost}>Ghost Button</button>
          </div>
        </div>
      </section>

      {/* Forms Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Form Elements</h2>
        <div className={styles.card}>
          <div className={styles.formGroup}>
            <label htmlFor="example-input">Text Input</label>
            <input type="text" id="example-input" placeholder="Enter task name..." className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="example-select">Select Menu</label>
            <select id="example-select" className={styles.input}>
              <option>High Priority</option>
              <option>Medium Priority</option>
              <option>Low Priority</option>
            </select>
          </div>
          <div className={styles.checkboxGroup}>
            <input type="checkbox" id="example-check" />
            <label htmlFor="example-check">Mark as complete</label>
          </div>
        </div>
      </section>

      {/* Components Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Feedback & Status</h2>
        <div className={styles.card}>
          <div className={`${styles.badge} ${styles.badgeSuccess}`}>Completed</div>
          <div className={`${styles.badge} ${styles.badgeWarning}`}>In Progress</div>
          <div className={`${styles.badge} ${styles.badgeDanger}`}>Overdue</div>
        </div>
      </section>
    </div>
  );
};

export default DesignSystem;