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

const tasks = await import('../ai/tasks');

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
});
