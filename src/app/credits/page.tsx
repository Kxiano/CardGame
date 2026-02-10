'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useSound } from '@/lib/sound';
import { LanguageSelector, SoundToggle } from '@/components/ui';

export default function CreditsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { playSound } = useSound();

  function handleBack() {
    playSound('click');
    router.push('/');
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4">
        <button className="btn btn-secondary btn-sm" onClick={handleBack}>
          ← {t('credits.backToHome')}
        </button>
        <div className="flex gap-3">
          <SoundToggle />
          <LanguageSelector />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-black/30 border border-white/10 rounded-2xl p-10 max-w-[500px] w-full">
          <h1 className="text-3xl text-gold text-center mb-8">{t('credits.title')}</h1>

          <div className="mb-6">
            <h2 className="text-base text-white/60 mb-2 uppercase tracking-wide">{t('credits.gameDesign')}</h2>
            <p className="text-lg text-white">{t('credits.originalGame')}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-base text-white/60 mb-2 uppercase tracking-wide">{t('credits.developedBy')}</h2>
            <p className="text-lg text-white">Xerekinha Brothers</p>
          </div>

          <div className="mb-6">
            <h2 className="text-base text-white/60 mb-2 uppercase tracking-wide">Technologies</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-gold/15 border border-gold/30 rounded-full text-sm text-gold">Next.js 15</span>
              <span className="px-3 py-1.5 bg-gold/15 border border-gold/30 rounded-full text-sm text-gold">React 19</span>
              <span className="px-3 py-1.5 bg-gold/15 border border-gold/30 rounded-full text-sm text-gold">Socket.IO</span>
              <span className="px-3 py-1.5 bg-gold/15 border border-gold/30 rounded-full text-sm text-gold">TypeScript</span>
              <span className="px-3 py-1.5 bg-gold/15 border border-gold/30 rounded-full text-sm text-gold">Tailwind CSS</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-base text-white/60 mb-2 uppercase tracking-wide">Features</h2>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              <li className="px-3 py-2 bg-white/5 rounded-lg text-[0.9375rem]">🎴 Real-time multiplayer (2-10 players)</li>
              <li className="px-3 py-2 bg-white/5 rounded-lg text-[0.9375rem]">🌍 Multilingual (English, Português, Magyar)</li>
              <li className="px-3 py-2 bg-white/5 rounded-lg text-[0.9375rem]">🎲 3 difficulty levels</li>
              <li className="px-3 py-2 bg-white/5 rounded-lg text-[0.9375rem]">🃏 Truco! optional rule</li>
              <li className="px-3 py-2 bg-white/5 rounded-lg text-[0.9375rem]">🏆 Live leaderboard</li>
              <li className="px-3 py-2 bg-white/5 rounded-lg text-[0.9375rem]">📱 Mobile-first design</li>
            </ul>
          </div>

          <div className="mt-8 text-center text-white/40 text-sm">
            {t('credits.version')} 1.0.0
          </div>
        </div>
      </div>
    </main>
  );
}
