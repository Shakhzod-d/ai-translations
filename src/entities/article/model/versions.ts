import type { ArticleVersion, ArticleVersionType } from '@/shared/api';
import type { CefrLevel } from '@/shared/config';
import { CEFR_LEVELS } from '@/shared/config';

export const ORIGINAL_VERSION_ID = 'original';

/** Stable id for a version slot, whether or not it has been generated yet. */
export const versionSlotId = (type: ArticleVersionType, level?: CefrLevel) =>
  level ? `${type}-${level.toLowerCase()}` : type;

export interface VersionSlot {
  id: string;
  type: ArticleVersionType;
  level?: CefrLevel;
  version?: ArticleVersion;
}

/**
 * All selectable versions: the original, every CEFR level (generated or not),
 * plus any additional generated modes (e.g. summary). New modes appear automatically.
 */
export const buildVersionSlots = (versions: ArticleVersion[]): VersionSlot[] => {
  const byId = new Map(versions.map((v) => [v.id, v]));
  const slots: VersionSlot[] = [
    { id: ORIGINAL_VERSION_ID, type: 'original', version: byId.get(ORIGINAL_VERSION_ID) },
    ...CEFR_LEVELS.map((level) => {
      const id = versionSlotId('simplified', level);
      return { id, type: 'simplified' as const, level, version: byId.get(id) };
    }),
  ];
  const known = new Set(slots.map((s) => s.id));
  for (const v of versions)
    if (!known.has(v.id)) slots.push({ id: v.id, type: v.type, level: v.level, version: v });
  return slots;
};

export const findSlot = (slots: VersionSlot[], id: string | null | undefined) =>
  slots.find((s) => s.id === id) ?? slots[0]!;
