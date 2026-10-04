import { Volume2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LevelBadge } from '@/entities/article';
import { useWordAnalysis, type WordAnalysis, type WordSense } from '@/entities/translation';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/shared/config';
import { speech } from '@/shared/lib';
import { IconButton, QueryErrorState, Skeleton, TextSkeleton } from '@/shared/ui';

interface WordDetailsProps {
  word: string;
  context?: string;
  preferredLanguage: LanguageCode;
  /** Slot for actions owned by other features (e.g. save to vocabulary). */
  renderActions?: (analysis: WordAnalysis) => ReactNode;
  onSelectWord?: (word: string) => void;
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</h3>
    {children}
  </section>
);

const SenseList = ({
  senses,
  onSelect,
}: {
  senses: WordSense[];
  onSelect?: (word: string) => void;
}) => (
  <ul className="flex flex-col gap-1.5">
    {senses.map((s) => (
      <li key={s.word} className="flex items-start gap-2 text-sm">
        <button
          type="button"
          onClick={() => onSelect?.(s.word)}
          className="text-primary focus-visible:ring-ring rounded font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          {s.word}
        </button>
        {s.level && <span className="text-muted-foreground text-xs">{s.level}</span>}
        <span className="text-muted-foreground">— {s.explanation}</span>
      </li>
    ))}
  </ul>
);

export const WordDetails = ({
  word,
  context,
  preferredLanguage,
  renderActions,
  onSelectWord,
}: WordDetailsProps) => {
  const { t } = useTranslation();
  const { data, isPending, error, refetch } = useWordAnalysis(word, context);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <Skeleton className="h-8 w-1/2" />
        <TextSkeleton lines={5} />
      </div>
    );
  }
  if (error) return <QueryErrorState error={error} onRetry={() => void refetch()} />;

  const languages = [
    preferredLanguage,
    ...SUPPORTED_LANGUAGES.filter((l) => l !== preferredLanguage),
  ];
  const translations = languages.flatMap((lng) =>
    data.translation[lng] ? [{ lng, value: data.translation[lng] }] : [],
  );

  return (
    <article className="flex flex-col gap-5" aria-label={data.query}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold">{data.query}</h2>
            {data.level && <LevelBadge level={data.level} />}
          </div>
          <p className="text-muted-foreground text-sm">
            {[data.phonetic, data.partOfSpeech].filter(Boolean).join(' · ')}
          </p>
        </div>
        <IconButton
          label={speech.isSupported() ? t('learning.listen') : t('learning.listenUnavailable')}
          icon={<Volume2 aria-hidden />}
          disabled={!speech.isSupported()}
          onClick={() => speech.speak(data.query)}
        />
      </header>

      {renderActions?.(data)}

      {translations.length > 0 && (
        <Section title={t('learning.translation')}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            {translations.map(({ lng, value }) => (
              <div key={lng} className="contents">
                <dt className="text-muted-foreground font-semibold uppercase">{lng}</dt>
                <dd lang={lng}>{value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      <Section title={t('learning.definition')}>
        <p className="text-sm">{data.definition ?? t('learning.noDefinition')}</p>
      </Section>

      {data.synonyms.length > 0 && (
        <Section title={t('learning.synonyms')}>
          <SenseList senses={data.synonyms} onSelect={onSelectWord} />
        </Section>
      )}
      {/* Antonyms are only shown when they naturally exist. */}
      {data.antonyms.length > 0 && (
        <Section title={t('learning.antonyms')}>
          <SenseList senses={data.antonyms} onSelect={onSelectWord} />
        </Section>
      )}
      {data.examples.length > 0 && (
        <Section title={t('learning.examples')}>
          <ul className="flex flex-col gap-1.5">
            {data.examples.map((ex) => (
              <li key={ex} className="border-primary/40 border-l-2 pl-3 text-sm italic">
                {ex}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {data.phrasalVerbs.length > 0 && (
        <Section title={t('learning.phrasalVerbs')}>
          <ul className="flex flex-col gap-2">
            {data.phrasalVerbs.map((pv) => (
              <li key={pv.phrase} className="text-sm">
                <span className="font-medium">{pv.phrase}</span> — {pv.meaning}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  );
};
