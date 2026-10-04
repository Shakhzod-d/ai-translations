import type { FileType } from '../contracts';

/**
 * Simulates the backend's text-extraction service. Detects the real format from
 * file content (magic bytes) instead of trusting the MIME type or extension.
 * Heavy parsers are lazy-loaded so they never enter the main bundle.
 */

export class ExtractionError extends Error {
  constructor(readonly code: 'EXTRACTION_FAILED' | 'EMPTY_DOCUMENT') {
    super(code);
  }
}

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  signature.every((byte, i) => bytes[i] === byte);

export const sniffFileType = (bytes: Uint8Array, fileName: string): FileType | null => {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return 'pdf';
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    return fileName.toLowerCase().endsWith('.docx') ? 'docx' : null;
  }
  // Binary content is never accepted as a text format.
  if (bytes.subarray(0, 1024).includes(0)) return null;
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'md' || ext === 'markdown') return 'md';
  return 'txt';
};

const extractPdf = async (buffer: ArrayBuffer) => {
  const pdfjs = await import('pdfjs-dist');
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    let text = '';
    for (const item of content.items) {
      if ('str' in item) text += item.str + (item.hasEOL ? '\n' : ' ');
    }
    pages.push(text);
  }
  return pages.join('\n\n');
};

const extractDocx = async (buffer: ArrayBuffer) => {
  const mammoth = await import('mammoth');
  const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
  return value;
};

const extractHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, noscript, nav, footer, header').forEach((el) => el.remove());
  const blocks = doc.body.querySelectorAll('h1, h2, h3, h4, p, li, blockquote');
  if (blocks.length === 0) return doc.body.textContent ?? '';
  return Array.from(blocks, (el) => el.textContent?.trim() ?? '').join('\n\n');
};

const extractMarkdown = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_`~]/g, '');

export const extractText = async (file: File): Promise<{ text: string; type: FileType }> => {
  const buffer = await file.arrayBuffer();
  const type = sniffFileType(new Uint8Array(buffer.slice(0, 1024)), file.name);
  if (!type) throw new ExtractionError('EXTRACTION_FAILED');

  let text: string;
  try {
    const decode = () => new TextDecoder().decode(buffer);
    switch (type) {
      case 'pdf':
        text = await extractPdf(buffer);
        break;
      case 'docx':
        text = await extractDocx(buffer);
        break;
      case 'html':
        text = extractHtml(decode());
        break;
      case 'md':
        text = extractMarkdown(decode());
        break;
      case 'txt':
        text = decode();
        break;
    }
  } catch {
    throw new ExtractionError('EXTRACTION_FAILED');
  }

  if (!text.trim()) throw new ExtractionError('EMPTY_DOCUMENT');
  return { text, type };
};
