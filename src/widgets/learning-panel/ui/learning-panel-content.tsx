import { MousePointerClick } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Article } from '@/entities/article';
import { PhrasalVerbList, WordDetails } from '@/features/analyze-word';
import { useReaderPreferences } from '@/features/customize-reader';
import { SaveWordButton } from '@/features/save-vocabulary';
import { useSelectionStore } from '@/features/select-text';
import { TranslateSelection } from '@/features/translate-text';

/** What the panel shows; the container (sidebar / sheet) is chosen separately per viewport. */
export const LearningPanelContent = ({ article }: { article: Article }) => {
  const { t } = useTranslation();
  const selection = useSelectionStore((s) => s.selection);
  const select = useSelectionStore((s) => s.select);
  const translationLanguage = useReaderPreferences((s) => s.translationLanguage);
  const updatePrefs = useReaderPreferences((s) => s.update);

  if (!selection) {
    return (
      <div className="flex flex-col gap-6">
        <div className="bg-muted/60 text-muted-foreground flex flex-col items-center gap-3 rounded-xl p-6 text-center text-sm">
          <MousePointerClick className="size-6" aria-hidden />
          <p>{t('learning.empty')}</p>
        </div>
        {article.phrasalVerbs.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">{t('reader.phrasalVerbs')}</h2>
            <PhrasalVerbList
              items={article.phrasalVerbs}
              language={translationLanguage}
              onSelect={(pv) => select({ text: pv.phrase, kind: 'word', context: pv.example })}
            />
          </section>
        )}
      </div>
    );
  }

  if (selection.kind === 'phrase') {
    return (
      <TranslateSelection
        text={selection.text}
        target={translationLanguage}
        onTargetChange={(lng) => updatePrefs({ translationLanguage: lng })}
      />
    );
  }

  return (
    <WordDetails
      key={selection.text}
      word={selection.text}
      context={selection.context}
      preferredLanguage={translationLanguage}
      onSelectWord={(word) => select({ text: word, kind: 'word' })}
      renderActions={(analysis) => (
        <SaveWordButton
          analysis={analysis}
          sourceDocumentId={article.id}
          className="w-full sm:w-auto"
        />
      )}
    />
  );
};
