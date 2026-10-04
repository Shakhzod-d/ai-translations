import { useTranslation } from 'react-i18next';
import { UploadDocument } from '@/features/upload-document';

export const DocumentUploadCard = () => {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="upload-heading" className="flex flex-col gap-3">
      <h2 id="upload-heading" className="text-lg font-semibold">
        {t('upload.title')}
      </h2>
      <UploadDocument />
    </section>
  );
};
