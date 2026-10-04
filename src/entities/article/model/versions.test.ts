import type { ArticleVersion } from '@/shared/api';
import { buildVersionSlots, findSlot } from './versions';

const version = (
  id: string,
  type: ArticleVersion['type'],
  level?: ArticleVersion['level'],
): ArticleVersion => ({ id, type, level, language: 'en', content: { paragraphs: [] } });

describe('buildVersionSlots', () => {
  it('lists original + all CEFR levels, marking which are generated', () => {
    const slots = buildVersionSlots([
      version('original', 'original'),
      version('simplified-b1', 'simplified', 'B1'),
    ]);
    expect(slots.map((s) => s.id)).toEqual([
      'original',
      'simplified-a1',
      'simplified-a2',
      'simplified-b1',
      'simplified-b2',
      'simplified-c1',
    ]);
    expect(slots.filter((s) => s.version).map((s) => s.id)).toEqual(['original', 'simplified-b1']);
  });

  it('appends new modes without code changes', () => {
    const slots = buildVersionSlots([
      version('original', 'original'),
      version('summary', 'summary'),
    ]);
    expect(slots.at(-1)?.type).toBe('summary');
  });

  it('falls back to the original for unknown ids', () => {
    expect(findSlot(buildVersionSlots([]), 'nope').id).toBe('original');
  });
});
