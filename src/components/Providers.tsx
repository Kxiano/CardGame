'use client';

import { ReactNode } from 'react';
import { SocketProvider } from '@/lib/socket';
import { I18nProvider } from '@/lib/i18n';
import { SoundProvider } from '@/lib/sound';
import { ToastProvider } from '@/components/ui';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <I18nProvider defaultLocale="en">
      <SoundProvider>
        <SocketProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SocketProvider>
      </SoundProvider>
    </I18nProvider>
  );
}
