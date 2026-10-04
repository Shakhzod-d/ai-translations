import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useIsAiConfigured } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { buttonVariants } from '@/shared/ui';

/** Renders nothing once a key is configured. */
export const AiSetupBanner = () => {
  const { t } = useTranslation();
  if (useIsAiConfigured()) return null;
  return (
    <aside className="border-primary/30 bg-primary/5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
      <Sparkles className="text-primary size-5 shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="font-medium">{t('ai.bannerTitle')}</p>
        <p className="text-muted-foreground text-sm">{t('ai.bannerBody')}</p>
      </div>
      <Link to={ROUTES.settings} className={buttonVariants({ size: 'sm' })}>
        {t('ai.bannerAction')}
      </Link>
    </aside>
  );
};
