import { useTranslation } from 'react-i18next';
import { DocumentImport } from './document-import';

export const DocumentUploadCard = () => {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="upload-heading" className="flex flex-col gap-3">
      <h2 id="upload-heading" className="text-lg font-semibold">
        {t('upload.title')}
      </h2>
      <DocumentImport />
    </section>
  );
};
