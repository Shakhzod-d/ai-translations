import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { articlesApi } from '@/shared/api';
import { renderWithProviders } from '@/shared/lib/test/render';
import { ImportTextForm } from './import-text-form';

const passage = Array.from({ length: 8 }, (_, i) => `Parkour sentence number ${i} is here.`).join(
  ' ',
);

describe('ImportTextForm', () => {
  it('rejects text that is too short', async () => {
    renderWithProviders(<ImportTextForm />);
    await userEvent.type(screen.getByLabelText('Text'), 'Too short.');
    await userEvent.click(screen.getByRole('button', { name: 'Create reading' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('at least 30 words');
  });

  it('creates an A2 reading with exercises from pasted corpus text', async () => {
    renderWithProviders(<ImportTextForm />);
    await userEvent.click(screen.getByLabelText('Text'));
    await userEvent.paste(passage);
    await userEvent.type(screen.getByLabelText('Title'), 'Parkour');
    await userEvent.click(screen.getByRole('button', { name: 'COCA' }));
    expect(screen.getByRole('radio', { name: 'A2' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Create reading' }));

    expect(await screen.findByText('Creating exercises…')).toBeInTheDocument();
    const link = await screen.findByRole('link', { name: 'Open article' }, { timeout: 4000 });
    const id = link.getAttribute('href')!.split('/').pop()!;
    const article = await articlesApi.getArticle(id);
    expect(article.title).toBe('Parkour');
    expect(article.metadata.source).toBe('COCA');
    expect(article.exercises[0]?.level).toBe('A2');
  });
});
