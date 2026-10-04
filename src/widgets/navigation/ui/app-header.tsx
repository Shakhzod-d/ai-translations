import { BookOpenText, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { LanguageMenu } from '@/features/change-language';
import { ThemeMenu } from '@/features/change-theme';
import { useCurrentUser } from '@/entities/user';
import { ROUTES } from '@/shared/config';
import { cn } from '@/shared/lib';
import { Tooltip } from '@/shared/ui';
import { NAV_ITEMS } from '../model/nav-items';

export const AppHeader = () => {
  const { t } = useTranslation();
  const user = useCurrentUser();
  return (
    <header className="border-border bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[100rem] items-center gap-2 px-4 sm:px-6">
        <Link
          to={ROUTES.home}
          className="focus-visible:ring-ring mr-2 flex items-center gap-2 rounded-md font-semibold focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <BookOpenText className="size-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">{t('common.appName')}</span>
        </Link>

        {/* Tablet: icon-only nav; desktop: icon + label. Mobile uses the bottom bar instead. */}
        <nav aria-label={t('nav.primary')} className="hidden sm:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.filter((i) => !i.end).map(({ to, labelKey, icon: Icon }) => (
              <li key={to}>
                <Tooltip content={t(labelKey)}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        'text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none lg:px-3',
                        isActive && 'bg-muted text-foreground',
                      )
                    }
                  >
                    <Icon className="size-4" aria-hidden />
                    <span className="sr-only lg:not-sr-only">{t(labelKey)}</span>
                  </NavLink>
                </Tooltip>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <LanguageMenu />
          <ThemeMenu />
          <span
            className="bg-secondary text-secondary-foreground ml-1 hidden size-8 items-center justify-center rounded-full lg:flex"
            title={user.displayName}
          >
            <UserRound className="size-4" aria-hidden />
            <span className="sr-only">{user.displayName}</span>
          </span>
        </div>
      </div>
    </header>
  );
};
