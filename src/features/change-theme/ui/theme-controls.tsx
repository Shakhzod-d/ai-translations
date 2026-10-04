import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  IconButton,
  SegmentedControl,
} from '@/shared/ui';
import { THEME_MODES, useThemeStore, type ThemeMode } from '../model/theme-store';

const ICONS: Record<ThemeMode, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

const useThemeOptions = () => {
  const { t } = useTranslation();
  return THEME_MODES.map((mode) => {
    const Icon = ICONS[mode];
    return { value: mode, label: t(`theme.${mode}`), icon: <Icon aria-hidden /> };
  });
};

/** Compact header control. */
export const ThemeMenu = () => {
  const { t } = useTranslation();
  const { mode, setMode } = useThemeStore();
  const options = useThemeOptions();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton
          label={`${t('theme.label')}: ${t(`theme.${mode}`)}`}
          icon={
            <>
              <Sun className="dark:hidden" aria-hidden />
              <Moon className="hidden dark:block" aria-hidden />
            </>
          }
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('theme.label')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.icon}
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** Full control for the settings page. */
export const ThemeSwitcher = () => {
  const { t } = useTranslation();
  const { mode, setMode } = useThemeStore();
  return (
    <SegmentedControl
      label={t('theme.label')}
      value={mode}
      options={useThemeOptions()}
      onValueChange={setMode}
    />
  );
};
