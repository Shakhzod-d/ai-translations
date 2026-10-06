import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useId } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ProcessingSteps, stagesForImport } from '@/entities/article';
import { useIsAiConfigured } from '@/shared/api';
import { buildReaderPath, CEFR_LEVELS } from '@/shared/config';
import { countWords } from '@/shared/lib';
import {
  Button,
  buttonVariants,
  ErrorState,
  FieldError,
  Input,
  Label,
  SegmentedControl,
  Textarea,
} from '@/shared/ui';
import {
  CORPORA,
  DEFAULT_IMPORT_VALUES,
  importTextSchema,
  MAX_WORDS,
  MIN_WORDS,
  type ImportTextValues,
} from '../model/import-schema';
import { useImportText } from '../model/use-import-text';

const LEVEL_OPTIONS = CEFR_LEVELS.map((l) => ({ value: l, label: l }));

/**
 * Create a reading from pasted text, e.g. a passage copied from a corpus (BNC, COCA).
 * The text is simplified to the chosen level and, optionally, exercises are written for it.
 */
export const ImportTextForm = ({ onImported }: { onImported?: (articleId: string) => void }) => {
  const { t } = useTranslation();
  const ids = { text: useId(), title: useId(), source: useId(), error: useId() };
  const aiReady = useIsAiConfigured();
  const { state, submit, retry, reset, withExercises } = useImportText();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset: resetForm,
    formState: { errors },
  } = useForm<ImportTextValues>({
    resolver: zodResolver(importTextSchema),
    defaultValues: DEFAULT_IMPORT_VALUES,
  });
  const text = useWatch({ control, name: 'text' });
  const words = countWords(text);
  const textError = errors.text?.message as 'import.tooShort' | 'import.tooLong' | undefined;

  if (state.status === 'processing') {
    return (
      <section aria-live="polite" className="flex flex-col gap-4">
        <h2 className="font-semibold">{t('processing.title')}</h2>
        <ProcessingSteps stage={state.stage} stages={stagesForImport(withExercises)} />
      </section>
    );
  }
  if (state.status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center" aria-live="polite">
        <CheckCircle2 className="text-success size-8" aria-hidden />
        <h2 className="font-semibold">{t('import.success')}</h2>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            to={buildReaderPath(state.articleId)}
            onClick={() => onImported?.(state.articleId)}
            className={buttonVariants()}
          >
            {t('upload.openArticle')}
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              resetForm(DEFAULT_IMPORT_VALUES);
            }}
          >
            {t('import.another')}
          </Button>
        </div>
      </div>
    );
  }
  if (state.status === 'error' || state.status === 'processingFailed') {
    const description =
      state.status === 'error' ? t(`errors.${state.code}`) : t(`processing.failed.${state.code}`);
    return (
      <ErrorState
        title={t('processing.failed.title')}
        description={description}
        onRetry={retry}
        action={
          <Button variant="ghost" onClick={reset}>
            {t('common.back')}
          </Button>
        }
      />
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={ids.text}>{t('import.text')}</Label>
          <span
            className={words > MAX_WORDS ? 'text-error text-xs' : 'text-muted-foreground text-xs'}
          >
            {t('import.wordCount', { count: words })} ·{' '}
            {t('import.limits', { min: MIN_WORDS, max: MAX_WORDS })}
          </span>
        </div>
        <Textarea
          id={ids.text}
          rows={8}
          className="max-h-[45dvh] min-h-40 resize-y"
          placeholder={t('import.textPlaceholder')}
          aria-invalid={!!textError}
          aria-describedby={textError ? ids.error : undefined}
          {...register('text')}
        />
        <FieldError id={ids.error}>
          {textError && t(textError, { min: MIN_WORDS, max: MAX_WORDS })}
        </FieldError>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {t('import.corpora')}
          {CORPORA.map((c) => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
            >
              {c.name} <ExternalLink className="size-3" aria-hidden />
            </a>
          ))}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.title}>{t('import.title')}</Label>
          <Input id={ids.title} placeholder={t('import.titlePlaceholder')} {...register('title')} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.source}>{t('import.source')}</Label>
          <Input
            id={ids.source}
            list={`${ids.source}-corpora`}
            placeholder={t('import.sourcePlaceholder')}
            {...register('source')}
          />
          <datalist id={`${ids.source}-corpora`}>
            {CORPORA.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
          <div className="flex gap-1.5">
            {CORPORA.map((c) => (
              <Button
                key={c.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue('source', c.name)}
              >
                {c.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('import.level')}</span>
        <Controller
          control={control}
          name="level"
          render={({ field }) => (
            <SegmentedControl
              label={t('import.level')}
              value={field.value}
              onValueChange={field.onChange}
              options={LEVEL_OPTIONS}
              className="w-full sm:w-fit"
            />
          )}
        />
        <p className="text-muted-foreground text-xs">{t('import.levelHint')}</p>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
        <input type="checkbox" className="accent-primary size-4" {...register('withExercises')} />
        {t('import.withExercises')}
      </label>

      {!aiReady && <p className="text-warning text-sm">{t('import.needsAi')}</p>}

      <Button type="submit" className="w-full sm:w-auto sm:self-end">
        {t('import.submit')}
      </Button>
    </form>
  );
};
