import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speech } from '@/shared/lib';
import { renderWithProviders } from '@/shared/lib/test/render';
import { WordFrequency } from './word-frequency';

describe('WordFrequency', () => {
  it('asks for a text when none is given', () => {
    renderWithProviders(<WordFrequency />);
    expect(screen.getByText('Drop a document to analyze')).toBeInTheDocument();
  });

  it('builds the table straight away for a given text', () => {
    renderWithProviders(
      <WordFrequency text={{ text: 'habari habari rafiki', name: 'Lesson 1' }} />,
    );
    expect(screen.queryByText('Drop a document to analyze')).not.toBeInTheDocument();
    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
    expect(screen.getAllByText('habari').length).toBeGreaterThan(0);
    expect(screen.getAllByText('rafiki').length).toBeGreaterThan(0);
  });

  it('pronounces a word when its speaker button is clicked', async () => {
    const speak = vi.spyOn(speech, 'speak').mockReturnValue(true);
    vi.spyOn(speech, 'isSupported').mockReturnValue(true);
    renderWithProviders(
      <WordFrequency text={{ text: 'hello hello world', name: 'Doc' }} lang="en" />,
    );
    await userEvent.click(screen.getAllByRole('button', { name: 'Listen: hello' })[0]!);
    expect(speak).toHaveBeenCalledWith('hello', 'en');
  });
});
