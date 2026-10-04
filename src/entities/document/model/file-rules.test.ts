import { MAX_FILE_SIZE_BYTES, validateFiles } from './file-rules';

const makeFile = (name: string, size = 10, type = '') => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('validateFiles', () => {
  it.each(['a.pdf', 'b.docx', 'c.txt', 'd.html', 'e.md'])('accepts %s', (name) => {
    expect(validateFiles([makeFile(name)])).toMatchObject({ ok: true });
  });

  it('rejects unsupported extensions', () => {
    expect(validateFiles([makeFile('virus.exe')])).toEqual({ ok: false, error: 'type' });
  });

  it('does not trust a mismatching MIME type', () => {
    expect(validateFiles([makeFile('fake.pdf', 10, 'application/x-msdownload')])).toEqual({
      ok: false,
      error: 'type',
    });
  });

  it('rejects empty and oversized files', () => {
    expect(validateFiles([makeFile('a.txt', 0)])).toEqual({ ok: false, error: 'empty' });
    expect(validateFiles([makeFile('a.txt', MAX_FILE_SIZE_BYTES + 1)])).toEqual({
      ok: false,
      error: 'size',
    });
  });

  it('requires exactly one file', () => {
    expect(validateFiles([])).toEqual({ ok: false, error: 'tooMany' });
    expect(validateFiles([makeFile('a.txt'), makeFile('b.txt')])).toEqual({
      ok: false,
      error: 'tooMany',
    });
  });
});
