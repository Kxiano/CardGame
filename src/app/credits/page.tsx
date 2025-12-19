'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useSound } from '@/lib/sound';
import { LanguageSelector, SoundToggle } from '@/components/ui';
import styles from './page.module.css';

export default function CreditsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { playSound } = useSound();

  const handleBack = () => {
    playSound('click');
    router.push('/');
  };

  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <button className="btn btn-secondary btn-sm" onClick={handleBack}>
          ← {t('credits.backToHome')}
        </button>
        <div className={styles.headerRight}>
          <SoundToggle />
          <LanguageSelector />
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.card}>
          <h1 className={styles.title}>{t('credits.title')}</h1>
          
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('credits.gameDesign')}</h2>
            <p className={styles.text}>{t('credits.originalGame')}</p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('credits.developedBy')}</h2>
            <p className={styles.text}>Xerekinha Brothers</p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Technologies</h2>
            <div className={styles.techList}>
              <span className={styles.tech}>Next.js 15</span>
              <span className={styles.tech}>React 19</span>
              <span className={styles.tech}>Socket.IO</span>
              <span className={styles.tech}>TypeScript</span>
              <span className={styles.tech}>Tailwind CSS</span>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Features</h2>
            <ul className={styles.featureList}>
              <li>🎴 Real-time multiplayer (2-10 players)</li>
              <li>🌍 Multilingual (English, Português, Magyar)</li>
              <li>🎲 3 difficulty levels</li>
              <li>🃏 Truco! optional rule</li>
              <li>🏆 Live leaderboard</li>
              <li>📱 Mobile-first design</li>
            </ul>
          </div>

          <div className={styles.version}>
            {t('credits.version')} 1.0.0
          </div>
        </div>
      </div>
    </main>
  );
}
