import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

describe('structured output format', () => {
  it('converts our Zod schemas into a JSON schema the API accepts', () => {
    const format = betaZodOutputFormat(
      z.object({ paragraphs: z.array(z.string()), level: z.enum(['A1', 'B1']) }),
    );
    expect(format.type).toBe('json_schema');
    expect(JSON.stringify(format.schema)).toContain('paragraphs');
    expect(format.parse('{"paragraphs":["a"],"level":"B1"}')).toEqual({
      paragraphs: ['a'],
      level: 'B1',
    });
  });
});
