import { useTranslation } from 'react-i18next';
import { PageContainer, PageHeader } from '@/shared/ui';
import { WordFrequency } from '@/widgets/word-frequency';

const FrequencyPage = () => {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader title={t('frequency.title')} description={t('frequency.subtitle')} />
      <WordFrequency />
    </PageContainer>
  );
};

export default FrequencyPage;
