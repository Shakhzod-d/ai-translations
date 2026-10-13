import { Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WordTranslations } from '@/shared/api';
import { LANGUAGE_NATIVE_NAMES, SUPPORTED_LANGUAGES } from '@/shared/config';
import { speech, type WordFrequency } from '@/shared/lib';
import { IconButton, Skeleton } from '@/shared/ui';

interface FrequencyTableProps {
  rows: WordFrequency[];
  translations: Map<string, WordTranslations>;
  /** Words currently being translated show a placeholder instead of a dash. */
  pending: boolean;
  /** Language of the words, for markup and pronunciation. */
  lang: string;
}

const SpeakButton = ({ word, lang }: { word: string; lang: string }) => {
  const { t } = useTranslation();
  const supported = speech.isSupported();
  return (
    <IconButton
      size="icon-sm"
      label={supported ? `${t('learning.listen')}: ${word}` : t('learning.listenUnavailable')}
      icon={<Volume2 aria-hidden />}
      disabled={!supported}
      onClick={() => speech.speak(word, lang)}
      className="text-muted-foreground hover:text-foreground shrink-0"
    />
  );
};

const formatPercent = (value: number, locale: string) =>
  value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Gloss = ({ value, pending }: { value?: string; pending: boolean }) =>
  value ? (
    <>{value}</>
  ) : pending ? (
    <Skeleton className="h-4 w-20" />
  ) : (
    <span className="text-muted-foreground">—</span>
  );

/** A real table from `md` up; stacked cards on phones, where seven columns can't fit. */
export const FrequencyTable = ({ rows, translations, pending, lang }: FrequencyTableProps) => {
  const { t, i18n } = useTranslation();
  const hasTranslations = translations.size > 0 || pending;

  return (
    <>
      <div className="border-border hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{t('frequency.table.caption')}</caption>
          <thead className="bg-muted/60 text-muted-foreground text-left">
            <tr>
              <th scope="col" className="w-14 px-3 py-2.5 text-right font-medium tabular-nums">
                {t('frequency.table.rank')}
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                {t('frequency.table.word')}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                {t('frequency.table.count')}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">
                {t('frequency.table.percent')}
              </th>
              {hasTranslations &&
                SUPPORTED_LANGUAGES.map((lng) => (
                  <th key={lng} scope="col" className="px-3 py-2.5 font-medium">
                    {LANGUAGE_NATIVE_NAMES[lng]}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {rows.map((row) => {
              const tr = translations.get(row.word);
              return (
                <tr key={row.word} className="hover:bg-muted/40">
                  <td className="text-muted-foreground px-3 py-2 text-right tabular-nums">
                    {row.rank}
                  </td>
                  <th scope="row" className="px-3 py-1 text-left font-medium">
                    <span className="flex items-center gap-1">
                      <span lang={lang}>{row.word}</span>
                      <SpeakButton word={row.word} lang={lang} />
                    </span>
                  </th>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.count.toLocaleString(i18n.language)}
                  </td>
                  <td className="text-muted-foreground px-3 py-2 text-right tabular-nums">
                    {formatPercent(row.percent, i18n.language)}
                  </td>
                  {hasTranslations &&
                    SUPPORTED_LANGUAGES.map((lng) => (
                      <td key={lng} className="px-3 py-2" lang={lng}>
                        <Gloss value={tr?.[lng]} pending={pending} />
                      </td>
                    ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ol className="flex flex-col gap-2 md:hidden" aria-label={t('frequency.table.caption')}>
        {rows.map((row) => {
          const tr = translations.get(row.word);
          return (
            <li key={row.word} className="border-border bg-card rounded-xl border p-3">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-8 shrink-0 text-right text-xs tabular-nums">
                  {row.rank}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-1">
                  <span className="truncate font-medium" lang={lang}>
                    {row.word}
                  </span>
                  <SpeakButton word={row.word} lang={lang} />
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {row.count.toLocaleString(i18n.language)}
                </span>
                <span className="text-muted-foreground w-14 text-right text-xs tabular-nums">
                  {formatPercent(row.percent, i18n.language)}%
                </span>
              </div>
              {hasTranslations && (
                <dl className="mt-2 ml-11 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  {SUPPORTED_LANGUAGES.map((lng) => (
                    <div key={lng} className="contents">
                      <dt className="text-muted-foreground text-xs leading-5 uppercase">{lng}</dt>
                      <dd lang={lng}>
                        <Gloss value={tr?.[lng]} pending={pending} />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
};
