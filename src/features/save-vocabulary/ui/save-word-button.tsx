import { Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSavedWordIndex, type VocabularyItem } from '@/entities/vocabulary';
import type { WordAnalysis } from '@/entities/translation';
import { normalizeWord } from '@/shared/lib';
import { Button, IconButton } from '@/shared/ui';
import { analysisToVocabulary, useRemoveWord, useSaveWord } from '../model/mutations';

/** Toggle: Save ↔ Saved (with remove). State is conveyed by icon + text + aria-pressed, not color alone. */
export const SaveWordButton = ({
  analysis,
  sourceDocumentId,
  className,
}: {
  analysis: WordAnalysis;
  sourceDocumentId?: string;
  className?: string;
}) => {
  const { t } = useTranslation();
  const { data: index } = useSavedWordIndex();
  const save = useSaveWord();
  const remove = useRemoveWord();
  const saved = index?.get(normalizeWord(analysis.query));

  return saved ? (
    <Button
      variant="secondary"
      className={className}
      aria-pressed
      onClick={() => !saved.id.startsWith('optimistic') && remove.mutate(saved)}
      title={t('learning.remove')}
    >
      <BookmarkCheck aria-hidden className="text-primary" /> {t('learning.saved')}
    </Button>
  ) : (
    <Button
      className={className}
      aria-pressed={false}
      onClick={() => save.mutate(analysisToVocabulary(analysis, sourceDocumentId))}
    >
      <Bookmark aria-hidden /> {t('learning.save')}
    </Button>
  );
};

export const RemoveWordButton = ({ item }: { item: VocabularyItem }) => {
  const { t } = useTranslation();
  const remove = useRemoveWord();
  return (
    <IconButton
      size="icon-sm"
      label={`${t('learning.remove')}: ${item.word}`}
      icon={<Trash2 aria-hidden />}
      onClick={() => remove.mutate(item)}
    />
  );
};
