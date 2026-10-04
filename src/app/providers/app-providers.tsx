import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { useThemeSync } from '@/features/change-theme';
import { i18n } from '@/shared/config/i18n';
import { Button, ErrorBoundary, ErrorState, Toaster, TooltipProvider } from '@/shared/ui';
import { createQueryClient } from './query-client';

const ThemeSync = () => {
  useThemeSync();
  return null;
};

const LocalizedToaster = () => {
  const { t } = useTranslation();
  return <Toaster closeLabel={t('common.close')} />;
};

const RootErrorFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <ErrorState
        title={t('errors.title')}
        description={t('errors.boundaryBody')}
        action={<Button onClick={() => window.location.reload()}>{t('errors.reload')}</Button>}
      />
    </div>
  );
};

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(createQueryClient);
  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary fallback={() => <RootErrorFallback />}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={400}>
            <ThemeSync />
            {children}
            <LocalizedToaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </I18nextProvider>
  );
};
