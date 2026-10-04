import { useTranslation } from 'react-i18next';
import { PageContainer, PageHeader } from '@/shared/ui';
import { VocabularyList } from '@/widgets/vocabulary-list';

const VocabularyPage = () => {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader title={t('vocabulary.title')} description={t('vocabulary.subtitle')} />
      <VocabularyList />
    </PageContainer>
  );
};

export default VocabularyPage;
