import 'fake-indexeddb/auto';
import { useAiSettings } from '../ai/ai-settings';
import { createLocalApis } from './local-api';

vi.mock('../ai/tasks', () => ({
  analyzeDocument: vi.fn(async () => ({
    title: 'AI Title',
    language: 'en',
    level: 'B2',
    phrasalVerbs: [],
  })),
  simplifyParagraphs: vi.fn(async (paragraphs: string[], level: string) =>
    paragraphs.map((p) => `[${level}] ${p}`),
  ),
  analyzeWordWithAi: vi.fn(async (word: string) => ({
    query: word,
    lemma: word,
    translation: { ru: 'перевод' },
    synonyms: [],
    antonyms: [],
    examples: [],
    phrasalVerbs: [],
  })),
  translateWithAi: vi.fn(async () => 'перевод'),
}));

vi.mock('../ai/exercises', () => ({
  generateExercisesWithAi: vi.fn(async (text: string, level: string) => ({
    id: `ex-${level}-${text.length}`,
    level,
    createdAt: '2026-01-01T00:00:00.000Z',
    multipleChoice: [],
    gapFill: [],
    matching: [],
    openQuestions: [{ id: 'o1', question: text.slice(0, 20), sampleAnswer: '' }],
  })),
}));

const tasks = await import('../ai/tasks');
const exerciseTasks = await import('../ai/exercises');

const waitForJob = async (api: ReturnType<typeof createLocalApis>['articles'], jobId: string) => {
  for (let i = 0; i < 100; i++) {
    const job = await api.getProcessingJob(jobId);
    if (job.status !== 'processing') return job;
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error('job timed out');
};

const textFile = (content: string, name = 'doc.txt') => {
  const file = new File([content], name, { type: 'text/plain' });
  file.arrayBuffer ??= () => new Response(file).arrayBuffer();
  return file;
};

describe('local adapter', () => {
  beforeEach(() => useAiSettings.getState().setApiKey('gemini', 'AIza-test'));

  it('processes a file with AI and persists it across adapter instances', async () => {
    const { articles } = createLocalApis();
    const job = await waitForJob(
      articles,
      (await articles.uploadArticle(textFile('One.\n\nTwo.'))).id,
    );
    expect(job.status).toBe('completed');
    const id = job.status === 'completed' ? job.articleId : '';

    const reloaded = createLocalApis().articles; // simulates a page reload
    const article = await reloaded.getArticle(id);
    expect(article.title).toBe('AI Title');
    expect(article.versions.map((v) => v.id)).toEqual(['original', 'simplified-b1']);
    expect(article.versions[1]?.content.paragraphs[0]?.text).toBe('[B1] One.');
  });

  it('still saves the document when no API key is configured', async () => {
    useAiSettings.getState().clearKey('gemini');
    const { articles } = createLocalApis();
    const job = await waitForJob(
      articles,
      (await articles.uploadArticle(textFile('Hello there.\n\nSecond.'))).id,
    );
    const article = await articles.getArticle(job.status === 'completed' ? job.articleId : '');
    expect(article.versions).toHaveLength(1);
  });

  it('caches word analysis so the same word is only paid for once', async () => {
    const { articles } = createLocalApis();
    vi.mocked(tasks.analyzeWordWithAi).mockClear();
    await articles.analyzeWord('cached', undefined);
    await articles.analyzeWord('Cached', undefined);
    expect(tasks.analyzeWordWithAi).toHaveBeenCalledTimes(1);
  });

  it('saves vocabulary without duplicates', async () => {
    const { vocabulary } = createLocalApis();
    await vocabulary.saveWord({ word: 'Unique', translation: {} });
    await vocabulary.saveWord({ word: 'unique', translation: {} });
    expect(
      (await vocabulary.listWords()).filter((w) => w.word.toLowerCase() === 'unique'),
    ).toHaveLength(1);
  });

  it('imports pasted text at the chosen level, with exercises written from that version', async () => {
    const { articles } = createLocalApis();
    vi.mocked(exerciseTasks.generateExercisesWithAi).mockClear();
    const job = await waitForJob(
      articles,
      (
        await articles.importText({
          text: 'Padel is new.\n\nPeople love it.',
          title: 'New sports',
          source: 'COCA',
          level: 'A2',
          withExercises: true,
        })
      ).id,
    );
    const article = await articles.getArticle(job.status === 'completed' ? job.articleId : '');
    expect(article.title).toBe('New sports'); // the user's title wins over the AI's
    expect(article.metadata.source).toBe('COCA');
    expect(article.versions.map((v) => v.id)).toEqual(['original', 'simplified-a2']);
    expect(article.exercises.map((e) => e.level)).toEqual(['A2']);
    expect(exerciseTasks.generateExercisesWithAi).toHaveBeenCalledWith(
      '[A2] Padel is new.\n\n[A2] People love it.',
      'A2',
    );
  });

  it('replaces the exercise set of a level instead of adding another', async () => {
    const { articles } = createLocalApis();
    const job = await waitForJob(articles, (await articles.uploadArticle(textFile('One.'))).id);
    const id = job.status === 'completed' ? job.articleId : '';
    expect((await articles.getArticle(id)).exercises).toEqual([]);
    await articles.generateExercises(id, 'B1');
    await articles.generateExercises(id, 'A2');
    await articles.generateExercises(id, 'B1');
    expect((await articles.getArticle(id)).exercises.map((e) => e.level)).toEqual(['A2', 'B1']);
  });

  it('reads documents saved before exercises existed', async () => {
    const { articles } = createLocalApis();
    const job = await waitForJob(articles, (await articles.uploadArticle(textFile('Old.'))).id);
    const id = job.status === 'completed' ? job.articleId : '';
    const { idb } = await import('@/shared/lib');
    const stored = (await idb.get<Record<string, unknown>>('articles', id))!;
    delete stored.exercises;
    await idb.set('articles', id, stored);
    expect((await articles.getArticle(id)).exercises).toEqual([]);
  });
});
