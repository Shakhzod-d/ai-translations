import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary, ErrorState, Spinner } from '@/shared/ui';
import { AppHeader, BottomNav } from '@/widgets/navigation';

const RouteFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="text-muted-foreground flex justify-center py-24">
      <Spinner label={t('common.loading')} />
    </div>
  );
};

export const AppLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-4"
      >
        {t('nav.skipToContent')}
      </a>
      <AppHeader />
      {/* Reset the boundary on navigation so one broken page doesn't break the app. */}
      <ErrorBoundary
        key={location.pathname}
        fallback={(reset) => (
          <ErrorState
            className="m-6"
            title={t('errors.title')}
            description={t('errors.boundaryBody')}
            onRetry={reset}
          />
        )}
      >
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] focus:outline-none sm:pb-0"
        >
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </ErrorBoundary>
      <BottomNav />
    </div>
  );
};
