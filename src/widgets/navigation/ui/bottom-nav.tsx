import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { cn } from '@/shared/lib';
import { NAV_ITEMS } from '../model/nav-items';

/** Mobile-only primary navigation, thumb-reachable and safe-area aware. */
export const BottomNav = () => {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('nav.primary')}
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'text-muted-foreground focus-visible:ring-ring flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                  isActive && 'text-primary',
                )
              }
            >
              <Icon className="size-5" aria-hidden />
              {t(labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
