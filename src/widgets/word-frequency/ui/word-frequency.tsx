import { Download, FileText, Languages, RotateCcw, Square } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError, useIsAiConfigured } from '@/shared/api';
import { LANGUAGE_NATIVE_NAMES, SUPPORTED_LANGUAGES } from '@/shared/config';
import { computeWordFrequency, SWAHILI_STOPWORDS, toCsv } from '@/shared/lib';
import {
  Button,
  EmptyState,
  Progress,
  QueryErrorState,
  SearchField,
  Select,
  toast,
} from '@/shared/ui';
import { useWordTranslations } from '../model/use-word-translations';
import { FrequencySource, type FrequencySourceText } from './frequency-source';
import { FrequencyTable } from './frequency-table';

const TOP_OPTIONS = ['50', '100', '250', '500', 'all'] as const;
type Top = (typeof TOP_OPTIONS)[number];
const MIN_LENGTH_OPTIONS = ['1', '2', '3', '4'] as const;

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="border-border bg-card rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3">
    <dt className="text-muted-foreground text-xs sm:text-sm">{label}</dt>
    <dd className="text-fluid-xl font-semibold tabular-nums">{value}</dd>
  </div>
);

const download = (fileName: string, content: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Word-frequency table for a corpus text, with AI glosses in English, Uzbek and Russian.
 * With `text` the table is built for that text right away (e.g. an uploaded document);
 * without it the user uploads or pastes a text first.
 */
export const WordFrequency = ({
  text: fixedSource,
  lang = 'sw',
}: {
  text?: FrequencySourceText;
  /** Language of the text, used for pronunciation. Pasted corpora default to Swahili. */
  lang?: string;
} = {}) => {
  const { t, i18n } = useTranslation();
  const aiReady = useIsAiConfigured();
  const [pickedSource, setSource] = useState<FrequencySourceText | null>(null);
  const source = fixedSource ?? pickedSource;
  const [minLength, setMinLength] = useState('1');
  const [top, setTop] = useState<Top>('100');
  const [hideStopwords, setHideStopwords] = useState(false);
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search.trim().toLocaleLowerCase());
  const { translations, status, translate, stop, reset } = useWordTranslations();

  const sourceText = source?.text;
  const frequency = useMemo(
    () =>
      sourceText !== undefined
        ? computeWordFrequency(sourceText, {
            minLength: Number(minLength),
            exclude: hideStopwords ? SWAHILI_STOPWORDS : undefined,
          })
        : null,
    [sourceText, minLength, hideStopwords],
  );

  const tableRows = useMemo(
    () =>
      frequency ? (top === 'all' ? frequency.rows : frequency.rows.slice(0, Number(top))) : [],
    [frequency, top],
  );
  const visibleRows = useMemo(
    () => (query ? tableRows.filter((r) => r.word.includes(query)) : tableRows),
    [tableRows, query],
  );

  if (!source || !frequency) return <FrequencySource onText={setSource} />;

  const fmt = (n: number) => n.toLocaleString(i18n.language);
  const untranslated = tableRows.filter((r) => !translations.has(r.word)).length;
  const running = status.kind === 'running';

  const runTranslate = async () => {
    if (await translate(tableRows.map((r) => r.word))) toast.success(t('frequency.translated'));
  };

  const exportCsv = () => {
    const header = [
      t('frequency.table.rank'),
      t('frequency.table.word'),
      t('frequency.table.count'),
      t('frequency.table.percent'),
      ...SUPPORTED_LANGUAGES.map((l) => LANGUAGE_NATIVE_NAMES[l]),
    ];
    const rows = tableRows.map((r) => {
      const tr = translations.get(r.word);
      return [
        r.rank,
        r.word,
        r.count,
        r.percent.toFixed(4),
        ...SUPPORTED_LANGUAGES.map((l) => tr?.[l] ?? ''),
      ];
    });
    const base = source.name.replace(/\.[^.]+$/, '') || 'text';
    download(`${base}-word-frequency.csv`, toCsv(header, rows));
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-sm">
          <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span className="text-muted-foreground">{t('frequency.source')}:</span>
          <span className="truncate font-medium">{source.name}</span>
        </p>
        {!fixedSource && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              setSource(null);
              setSearch('');
            }}
          >
            <RotateCcw aria-hidden /> {t('frequency.newText')}
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-2 sm:gap-4">
        <Stat label={t('frequency.stats.tokens')} value={fmt(frequency.totalTokens)} />
        <Stat label={t('frequency.stats.unique')} value={fmt(frequency.uniqueWords)} />
        <Stat label={t('frequency.stats.shown')} value={fmt(tableRows.length)} />
      </dl>

      <section
        aria-label={t('frequency.options.label')}
        className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t('frequency.options.top')}
            <Select
              value={top}
              onValueChange={setTop}
              options={TOP_OPTIONS.map((v) => ({
                value: v,
                label: v === 'all' ? t('frequency.options.all') : v,
              }))}
              className="sm:w-28"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t('frequency.options.minLength')}
            <Select
              value={minLength}
              onValueChange={setMinLength}
              options={MIN_LENGTH_OPTIONS.map((v) => ({ value: v, label: v }))}
              className="sm:w-24"
            />
          </label>
          <label className="col-span-2 flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hideStopwords}
              onChange={(e) => setHideStopwords(e.target.checked)}
              className="accent-primary size-4"
            />
            {t('frequency.options.stopwords')}
          </label>
        </div>
        <SearchField
          value={search}
          onChange={setSearch}
          label={t('frequency.options.search')}
          className="lg:w-64"
        />
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {running ? (
          <>
            <div className="flex flex-1 flex-col gap-1.5" aria-live="polite">
              <p className="text-muted-foreground text-sm tabular-nums">
                {t('frequency.translating', { done: status.done, total: status.total })}
              </p>
              <Progress
                value={status.done / status.total}
                label={t('frequency.translating', { done: status.done, total: status.total })}
              />
            </div>
            <Button variant="outline" onClick={stop}>
              <Square aria-hidden /> {t('frequency.stop')}
            </Button>
          </>
        ) : (
          <Button onClick={runTranslate} disabled={!aiReady || untranslated === 0}>
            <Languages aria-hidden />
            {untranslated === 0 && tableRows.length > 0
              ? t('frequency.translateDone')
              : t('frequency.translate', { count: untranslated })}
          </Button>
        )}
        <Button variant="outline" onClick={exportCsv} disabled={tableRows.length === 0}>
          <Download aria-hidden /> {t('frequency.exportCsv')}
        </Button>
      </div>

      {!aiReady && <QueryErrorState error={new ApiError('AI_NOT_CONFIGURED')} />}
      {status.kind === 'error' && (
        <QueryErrorState error={status.error} onRetry={() => void translate(status.words)} />
      )}

      {visibleRows.length ? (
        <FrequencyTable
          rows={visibleRows}
          translations={translations}
          pending={running}
          lang={lang}
        />
      ) : (
        <EmptyState title={t('frequency.table.empty')} />
      )}
    </div>
  );
};
