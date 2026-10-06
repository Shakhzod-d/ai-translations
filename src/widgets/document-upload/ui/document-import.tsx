import { ClipboardPaste, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ImportTextForm } from '@/features/import-text';
import { UploadDocument } from '@/features/upload-document';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';

/** The two ways to add a reading: upload a file or paste text (e.g. from a corpus). */
export const DocumentImport = ({ onDone }: { onDone?: (articleId: string) => void }) => {
  const { t } = useTranslation();
  return (
    <Tabs defaultValue="file" className="flex flex-col gap-4">
      <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-fit">
        <TabsTrigger value="file">
          <Upload className="size-4" aria-hidden /> {t('import.tabFile')}
        </TabsTrigger>
        <TabsTrigger value="text">
          <ClipboardPaste className="size-4" aria-hidden /> {t('import.tabText')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="file">
        <UploadDocument onUploaded={onDone} />
      </TabsContent>
      <TabsContent value="text">
        <ImportTextForm onImported={onDone} />
      </TabsContent>
    </Tabs>
  );
};
