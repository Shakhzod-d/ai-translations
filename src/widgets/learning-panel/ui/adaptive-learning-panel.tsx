import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Article } from '@/entities/article';
import { useSelectionStore } from '@/features/select-text';
import { useViewport } from '@/shared/lib';
import { BottomSheet, BottomSheetContent, IconButton } from '@/shared/ui';
import { useLearningPanelStore } from '../model/panel-store';
import { LearningPanelContent } from './learning-panel-content';

/**
 * Different interaction pattern per device class — not a shrunken desktop:
 * - desktop: permanent sticky sidebar column
 * - tablet: collapsible side column (auto-expands on selection)
 * - mobile: bottom sheet that opens on selection
 */
export const AdaptiveLearningPanel = ({ article }: { article: Article }) => {
  const viewport = useViewport();
  if (viewport === 'mobile') return <MobileSheet article={article} />;
  return <SidePanel article={article} collapsible={viewport === 'tablet'} />;
};

const SidePanel = ({ article, collapsible }: { article: Article; collapsible: boolean }) => {
  const { t } = useTranslation();
  const { tabletOpen, setTabletOpen } = useLearningPanelStore();
  const hasSelection = useSelectionStore((s) => !!s.selection);
  const open = !collapsible || tabletOpen;

  useEffect(() => {
    if (collapsible && hasSelection) setTabletOpen(true);
  }, [collapsible, hasSelection, setTabletOpen]);

  if (!open) {
    return (
      <div className="sticky top-20">
        <IconButton
          variant="outline"
          label={t('reader.openPanel')}
          icon={<PanelRightOpen aria-hidden />}
          onClick={() => setTabletOpen(true)}
        />
      </div>
    );
  }

  return (
    <aside
      aria-label={t('reader.learningPanel')}
      className="border-border bg-card sticky top-20 flex max-h-[calc(100dvh-6rem)] w-80 flex-col overflow-hidden rounded-2xl border lg:w-auto"
    >
      <div className="border-border flex items-center justify-between border-b px-4 py-2.5">
        <h2 className="text-sm font-semibold">{t('reader.learningPanel')}</h2>
        {collapsible && (
          <IconButton
            size="icon-sm"
            label={t('reader.closePanel')}
            icon={<PanelRightClose aria-hidden />}
            onClick={() => setTabletOpen(false)}
          />
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4" aria-live="polite">
        <LearningPanelContent article={article} />
      </div>
    </aside>
  );
};

const MobileSheet = ({ article }: { article: Article }) => {
  const { t } = useTranslation();
  const selection = useSelectionStore((s) => s.selection);
  const clear = useSelectionStore((s) => s.clear);
  return (
    <BottomSheet open={!!selection} onOpenChange={(open) => !open && clear()}>
      <BottomSheetContent
        title={selection?.text ?? t('reader.learningPanel')}
        hideTitle
        closeLabel={t('common.close')}
      >
        <LearningPanelContent article={article} />
      </BottomSheetContent>
    </BottomSheet>
  );
};
