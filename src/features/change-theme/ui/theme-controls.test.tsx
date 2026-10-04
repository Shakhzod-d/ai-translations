import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useThemeSync } from '../model/use-theme-sync';
import { useThemeStore } from '../model/theme-store';
import { ThemeSwitcher } from './theme-controls';

const Harness = () => {
  useThemeSync();
  return <ThemeSwitcher />;
};

describe('ThemeSwitcher', () => {
  afterEach(() => useThemeStore.setState({ mode: 'system' }));

  it('applies dark and light themes to the document', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement).toHaveClass('dark');
    await userEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('follows the system preference in system mode', () => {
    render(<Harness />);
    // matchMedia is stubbed to "not dark" in the test setup
    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('supports arrow-key navigation', async () => {
    render(<Harness />);
    screen.getByRole('radio', { name: 'System' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
  });
});
