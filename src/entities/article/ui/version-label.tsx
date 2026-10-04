import { useTranslation } from 'react-i18next';
import type { VersionSlot } from '../model/versions';

export const useVersionLabel = () => {
  const { t } = useTranslation();
  return (slot: Pick<VersionSlot, 'type' | 'level'>) => {
    switch (slot.type) {
      case 'original':
        return t('reader.original');
      case 'simplified':
        return t('reader.simplified', { level: slot.level ?? '' });
      case 'summary':
        return t('reader.summary');
    }
  };
};
