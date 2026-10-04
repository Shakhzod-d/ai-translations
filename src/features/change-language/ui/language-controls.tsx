import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_NATIVE_NAMES, SUPPORTED_LANGUAGES, type LanguageCode } from '@/shared/config';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  SegmentedControl,
} from '@/shared/ui';
import { useUiLanguage } from '../model/use-language';

const OPTIONS = SUPPORTED_LANGUAGES.map((lng) => ({
  value: lng,
  label: LANGUAGE_NATIVE_NAMES[lng],
}));

export const LanguageMenu = () => {
  const { t } = useTranslation();
  const { language, setLanguage } = useUiLanguage();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 gap-1.5 px-2.5"
          aria-label={`${t('language.label')}: ${LANGUAGE_NATIVE_NAMES[language]}`}
        >
          <Languages aria-hidden />
          <span className="text-xs font-semibold uppercase">{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('language.label')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(v) => setLanguage(v as LanguageCode)}
        >
          {OPTIONS.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value} lang={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const LanguageSwitcher = () => {
  const { t } = useTranslation();
  const { language, setLanguage } = useUiLanguage();
  return (
    <SegmentedControl
      label={t('language.label')}
      value={language}
      options={OPTIONS}
      onValueChange={setLanguage}
    />
  );
};
