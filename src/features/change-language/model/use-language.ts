import { useTranslation } from 'react-i18next';
import { DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode } from '@/shared/config';

/** Current UI language + setter. i18next persists the choice (see shared/config/i18n). */
export const useUiLanguage = () => {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage;
  const language: LanguageCode = isLanguageCode(current) ? current : DEFAULT_LANGUAGE;
  const setLanguage = (next: LanguageCode) => void i18n.changeLanguage(next);
  return { language, setLanguage };
};
