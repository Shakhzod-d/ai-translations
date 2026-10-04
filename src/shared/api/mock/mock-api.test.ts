import { articleSchema, processingJobSchema } from '../contracts';
import { createMockApis } from './mock-api';
import { sniffFileType } from '../extraction/extract';

describe('mock API', () => {
  it('processes an uploaded text file into a structured article', async () => {
    const { articles } = createMockApis({ latency: 0, persist: false });
    const file = new File(
      ['First paragraph here.\n\nWe need to figure out the plan.'],
      'notes.txt',
      { type: 'text/plain' },
    );
    file.arrayBuffer ??= () => new Response(file).arrayBuffer();
    const job = processingJobSchema.parse(await articles.uploadArticle(file));
    let current = job;
    for (let i = 0; i < 50 && current.status === 'processing'; i++) {
      await new Promise((r) => setTimeout(r, 5));
      current = await articles.getProcessingJob(job.id);
    }
    expect(current.status).toBe('completed');
    const article = articleSchema.parse(
      await articles.getArticle(current.status === 'completed' ? current.articleId : ''),
    );
    expect(article.versions[0]?.content.paragraphs).toHaveLength(2);
    expect(article.phrasalVerbs.map((p) => p.phrase)).toContain('figure out');
  });

  it('sniffs content instead of trusting the extension', () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(sniffFileType(pdfBytes, 'renamed.txt')).toBe('pdf');
    expect(sniffFileType(new Uint8Array([0x4d, 0x5a, 0x00, 0x00]), 'evil.txt')).toBeNull();
  });
});
