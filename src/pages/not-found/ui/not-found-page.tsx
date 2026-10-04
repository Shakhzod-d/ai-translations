import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/config';
import { buttonVariants, EmptyState, PageContainer } from '@/shared/ui';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <EmptyState
        title={t('notFound.title')}
        description={t('notFound.body')}
        action={
          <Link to={ROUTES.home} className={buttonVariants()}>
            {t('notFound.home')}
          </Link>
        }
      />
    </PageContainer>
  );
};

export default NotFoundPage;
