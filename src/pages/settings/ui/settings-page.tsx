import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AiSettingsForm } from '@/features/configure-ai';
import { LanguageSwitcher } from '@/features/change-language';
import { ThemeSwitcher } from '@/features/change-theme';
import { ReaderPreferencesForm } from '@/features/customize-reader';
import { Card, PageContainer, PageHeader } from '@/shared/ui';

const SettingsSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card className="flex flex-col gap-4 p-5">
    <h2 className="text-base font-semibold">{title}</h2>
    {children}
  </Card>
);

const SettingsPage = () => {
  const { t } = useTranslation();
  return (
    <PageContainer className="max-w-3xl">
      <PageHeader title={t('settings.title')} />
      <div className="flex flex-col gap-4">
        <SettingsSection title={t('ai.title')}>
          <AiSettingsForm />
        </SettingsSection>
        <SettingsSection title={t('settings.appearance')}>
          <ThemeSwitcher />
        </SettingsSection>
        <SettingsSection title={t('settings.language')}>
          <LanguageSwitcher />
        </SettingsSection>
        <SettingsSection title={t('settings.reader')}>
          <ReaderPreferencesForm />
        </SettingsSection>
      </div>
    </PageContainer>
  );
};

export default SettingsPage;
