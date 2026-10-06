import { Upload } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, DialogContent, PageContainer, PageHeader } from '@/shared/ui';
import { DocumentLibrary } from '@/widgets/document-library';
import { DocumentImport } from '@/widgets/document-upload';

const DocumentsPage = () => {
  const { t } = useTranslation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const uploadButton = (
    <Button onClick={() => setUploadOpen(true)}>
      <Upload aria-hidden /> {t('documents.upload')}
    </Button>
  );
  return (
    <PageContainer>
      <PageHeader
        title={t('documents.title')}
        description={t('documents.subtitle')}
        actions={uploadButton}
      />
      <DocumentLibrary emptyAction={uploadButton} />
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent
          title={t('upload.title')}
          closeLabel={t('common.close')}
          className="sm:max-w-2xl"
        >
          <DocumentImport onDone={() => setUploadOpen(false)} />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default DocumentsPage;
