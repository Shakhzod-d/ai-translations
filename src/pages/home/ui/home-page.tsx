import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AiSetupBanner } from '@/features/configure-ai';
import { ROUTES } from '@/shared/config';
import { PageContainer } from '@/shared/ui';
import { DocumentUploadCard } from '@/widgets/document-upload';
import { RecentDocuments } from '@/widgets/document-library';

const HomePage = () => {
  const { t } = useTranslation();
  return (
    <PageContainer className="flex flex-col gap-10">
      <AiSetupBanner />
      <section className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div className="flex flex-col gap-4 lg:pt-8">
          <h1 className="text-fluid-4xl leading-[1.1] font-semibold tracking-tight text-balance">
            {t('home.title')}
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg text-pretty">{t('home.subtitle')}</p>
        </div>
        <DocumentUploadCard />
      </section>
      <section aria-labelledby="recent-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 id="recent-heading" className="text-lg font-semibold">
            {t('home.recent')}
          </h2>
          <Link
            to={ROUTES.documents}
            className="text-primary focus-visible:ring-ring inline-flex items-center gap-1 rounded text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            {t('home.viewAll')} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <RecentDocuments />
      </section>
    </PageContainer>
  );
};

export default HomePage;
