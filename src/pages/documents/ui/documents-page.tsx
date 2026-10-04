import { Upload } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadDocument } from '@/features/upload-document';
import { Button, Dialog, DialogContent, PageContainer, PageHeader } from '@/shared/ui';
import { DocumentLibrary } from '@/widgets/document-library';

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
        <DialogContent title={t('upload.title')} closeLabel={t('common.close')}>
          <UploadDocument onUploaded={() => setUploadOpen(false)} />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default DocumentsPage;
