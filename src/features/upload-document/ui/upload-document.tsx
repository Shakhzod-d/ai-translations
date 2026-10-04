import { CheckCircle2, FileText, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ACCEPT_ATTRIBUTE, MAX_FILE_SIZE_MB, SUPPORTED_TYPE_LABELS } from '@/entities/document';
import { buildReaderPath } from '@/shared/config';
import { Button, buttonVariants, ErrorState, FileDropzone } from '@/shared/ui';
import { useUploadDocument, type UploadState } from '../model/use-upload-document';
import { ProcessingSteps } from './processing-steps';

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const FileRow = ({
  file,
  onCancel,
  cancelLabel,
}: {
  file: File;
  onCancel?: () => void;
  cancelLabel: string;
}) => (
  <div className="bg-muted flex items-center gap-3 rounded-lg px-3 py-2">
    <FileText className="text-muted-foreground size-5 shrink-0" aria-hidden />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">{file.name}</p>
      <p className="text-muted-foreground text-xs">{formatSize(file.size)}</p>
    </div>
    {onCancel && (
      <Button variant="ghost" size="sm" onClick={onCancel}>
        <X aria-hidden /> {cancelLabel}
      </Button>
    )}
  </div>
);

export const UploadDocument = ({ onUploaded }: { onUploaded?: (articleId: string) => void }) => {
  const { t } = useTranslation();
  const { state, start, cancel, retry, reset } = useUploadDocument();

  if (state.status === 'idle' || state.status === 'invalid') {
    return (
      <div className="flex flex-col gap-3">
        <FileDropzone
          accept={ACCEPT_ATTRIBUTE}
          onFiles={start}
          title={t('upload.dropHere')}
          activeTitle={t('upload.dragActive')}
          orLabel={t('upload.or')}
          browseLabel={t('upload.browse')}
          hint={t('upload.hint', { types: SUPPORTED_TYPE_LABELS, size: MAX_FILE_SIZE_MB })}
        />
        {state.status === 'invalid' && (
          <p role="alert" className="text-error text-sm">
            {t(`upload.errors.${state.error}`, { size: MAX_FILE_SIZE_MB })}
          </p>
        )}
      </div>
    );
  }

  return (
    <section
      aria-live="polite"
      className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-5"
    >
      <UploadBody
        state={state}
        onCancel={cancel}
        onRetry={retry}
        onReset={reset}
        onUploaded={onUploaded}
      />
    </section>
  );
};

const UploadBody = ({
  state,
  onCancel,
  onRetry,
  onReset,
  onUploaded,
}: {
  state: Exclude<UploadState, { status: 'idle' | 'invalid' }>;
  onCancel: () => void;
  onRetry: () => void;
  onReset: () => void;
  onUploaded?: (articleId: string) => void;
}) => {
  const { t } = useTranslation();
  switch (state.status) {
    case 'uploading':
    case 'processing':
      return (
        <>
          <h2 className="font-semibold">{t('processing.title')}</h2>
          <FileRow file={state.file} onCancel={onCancel} cancelLabel={t('common.cancel')} />
          <ProcessingSteps
            stage={state.status === 'uploading' ? 'uploading' : state.stage}
            uploadProgress={state.status === 'uploading' ? state.progress : undefined}
          />
        </>
      );
    case 'success':
      return (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <CheckCircle2 className="text-success size-8" aria-hidden />
          <h2 className="font-semibold">{t('upload.success')}</h2>
          <FileRow file={state.file} cancelLabel={t('common.cancel')} />
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to={buildReaderPath(state.articleId)}
              onClick={() => onUploaded?.(state.articleId)}
              className={buttonVariants()}
            >
              {t('upload.openArticle')}
            </Link>
            <Button variant="outline" onClick={onReset}>
              {t('upload.uploadAnother')}
            </Button>
          </div>
        </div>
      );
    case 'error':
      return (
        <ErrorState
          title={t('errors.title')}
          description={t(`errors.${state.code}`)}
          onRetry={onRetry}
          action={
            <Button variant="ghost" onClick={onReset}>
              {t('common.cancel')}
            </Button>
          }
        />
      );
    case 'processingFailed':
      return (
        <ErrorState
          title={t('processing.failed.title')}
          description={t(`processing.failed.${state.code}`)}
          onRetry={
            state.code === 'AI_UNAVAILABLE' || state.code === 'UNKNOWN' ? onRetry : undefined
          }
          action={
            <Button variant="ghost" onClick={onReset}>
              {t('upload.uploadAnother')}
            </Button>
          }
        />
      );
  }
};
