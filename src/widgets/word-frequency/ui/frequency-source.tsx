import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILE_SIZE_MB,
  SUPPORTED_TYPE_LABELS,
  validateFiles,
} from '@/entities/document';
import { ExtractionError, extractText } from '@/shared/api';
import {
  Button,
  Card,
  CardContent,
  FieldError,
  FileDropzone,
  Label,
  Spinner,
  Textarea,
} from '@/shared/ui';

export interface FrequencySourceText {
  text: string;
  name: string;
}

/** Picks the text to analyze: an uploaded document (PDF, DOCX…) or pasted text. */
export const FrequencySource = ({ onText }: { onText: (source: FrequencySourceText) => void }) => {
  const { t } = useTranslation();
  const pasteId = useId();
  const errorId = useId();
  const [pasted, setPasted] = useState('');
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    setError(null);
    const result = validateFiles(files);
    if (!result.ok) {
      setError(t(`upload.errors.${result.error}`, { size: MAX_FILE_SIZE_MB }));
      return;
    }
    setReading(true);
    try {
      const { text } = await extractText(result.file);
      onText({ text, name: result.file.name });
    } catch (e) {
      setError(
        t(`frequency.errors.${e instanceof ExtractionError ? e.code : 'EXTRACTION_FAILED'}`),
      );
    } finally {
      setReading(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-4 sm:pt-5">
        {reading ? (
          <div className="text-muted-foreground flex justify-center py-16" aria-live="polite">
            <Spinner label={t('frequency.reading')} />
          </div>
        ) : (
          <FileDropzone
            accept={ACCEPT_ATTRIBUTE}
            onFiles={handleFiles}
            title={t('frequency.dropTitle')}
            activeTitle={t('frequency.dropActive')}
            browseLabel={t('frequency.browse')}
            orLabel={t('frequency.or')}
            hint={t('frequency.hint', { types: SUPPORTED_TYPE_LABELS, size: MAX_FILE_SIZE_MB })}
          />
        )}
        <FieldError id={errorId}>{error}</FieldError>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (pasted.trim()) onText({ text: pasted, name: t('frequency.pasted') });
          }}
        >
          <Label htmlFor={pasteId}>{t('frequency.pasteLabel')}</Label>
          <Textarea
            id={pasteId}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder={t('frequency.pastePlaceholder')}
            className="min-h-32 sm:min-h-40"
            lang="sw"
          />
          <Button type="submit" className="self-stretch sm:self-end" disabled={!pasted.trim()}>
            {t('frequency.analyze')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
