import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { articlesApi } from '@/shared/api';
import { renderWithProviders } from '@/shared/lib/test/render';
import ReaderPage from './reader-page';

const renderReader = async (id?: string) => {
  const articleId = id ?? (await articlesApi.listArticles())[0]!.id;
  return renderWithProviders(
    <Routes>
      <Route path="/reader/:articleId" element={<ReaderPage />} />
    </Routes>,
    { route: `/reader/${articleId}` },
  );
};

// jsdom has no layout: force the desktop interaction pattern for these tests.
const mockDesktop = () =>
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches: String(query).includes('min-width'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

describe('ReaderPage', () => {
  beforeEach(mockDesktop);

  it('renders the original article', async () => {
    await renderReader();
    expect(
      await screen.findByRole('heading', { level: 1, name: /small companies/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Original' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getAllByRole('button', { name: 'unprecedented' }).length).toBeGreaterThan(0);
  });

  it('switches to a simplified version', async () => {
    await renderReader();
    await userEvent.click(await screen.findByRole('radio', { name: 'Simplified B1' }));
    expect(screen.getByRole('radio', { name: 'Simplified B1' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    const doc = screen.getByRole('document', { name: 'Simplified B1' });
    expect(within(doc).queryByText('unprecedented')).not.toBeInTheDocument();
    expect(within(doc).getByText('Profit', { exact: false })).toBeInTheDocument();
  });

  it('generates a version that does not exist yet', async () => {
    await renderReader();
    await userEvent.click(await screen.findByRole('radio', { name: /Simplified A2/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Generate A2' }));
    expect(await screen.findByRole('document', { name: 'Simplified A2' })).toBeInTheDocument();
  });

  it('shows word details and saves the word to vocabulary', async () => {
    await renderReader();
    const [word] = await screen.findAllByRole('button', { name: 'unprecedented' });
    await userEvent.click(word!);
    const panel = screen.getByRole('complementary', { name: 'Learning panel' });
    expect(await within(panel).findByText('Never done or known before.')).toBeInTheDocument();
    expect(within(panel).getByText('беспрецедентный')).toBeInTheDocument();
    expect(within(panel).getByText('ordinary')).toBeInTheDocument();

    await userEvent.click(within(panel).getByRole('button', { name: /save word/i }));
    expect(
      await within(panel).findByRole('button', { name: /saved to vocabulary/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports keyboard selection of words', async () => {
    await renderReader();
    await screen.findAllByRole('button', { name: 'unprecedented' });
    const first = document.querySelector<HTMLElement>('[data-word][tabindex="0"]')!;
    first.focus();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    const panel = screen.getByRole('complementary', { name: 'Learning panel' });
    expect(
      await within(panel).findByRole('heading', { level: 2, name: 'the' }),
    ).toBeInTheDocument();
  });

  it('shows a not-found state for unknown articles', async () => {
    await renderReader('missing');
    expect(await screen.findByText(/doesn't exist or was deleted/i)).toBeInTheDocument();
  });
});
