import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/shared/lib/test/render';
import { UploadDocument } from './upload-document';

describe('UploadDocument', () => {
  it('rejects an unsupported file with a friendly message', async () => {
    renderWithProviders(<UploadDocument />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await userEvent.upload(input, new File(['x'], 'image.png', { type: 'image/png' }), {
      applyAccept: false,
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/isn't supported/i);
  });

  it('uploads, shows processing stages, and offers to open the article', async () => {
    renderWithProviders(<UploadDocument />);
    const file = new File(['Hello world.\n\nSecond paragraph.'], 'hello.txt', {
      type: 'text/plain',
    });
    await userEvent.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, file);
    expect(await screen.findByText('Preparing your article')).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'Open article' }, { timeout: 4000 }),
    ).toHaveAttribute('href', expect.stringMatching(/^\/reader\//));
  });

  it('can cancel an upload in progress', async () => {
    renderWithProviders(<UploadDocument />);
    await userEvent.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['a b'], 'a.txt', { type: 'text/plain' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: /cancel/i }));
    expect(screen.getByText('Drag & drop a document here')).toBeInTheDocument();
  });
});
