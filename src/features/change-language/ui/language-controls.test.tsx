import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { i18n } from '@/shared/config/i18n';
import { STORAGE_KEYS } from '@/shared/config';
import { LanguageSwitcher } from './language-controls';

describe('LanguageSwitcher', () => {
  afterEach(() => i18n.changeLanguage('en'));

  it('switches the UI language and persists it', async () => {
    render(<LanguageSwitcher />);
    await userEvent.click(screen.getByRole('radio', { name: 'Русский' }));
    expect(i18n.t('upload.title')).toBe('Загрузить статью');
    expect(screen.getByRole('radiogroup', { name: 'Язык интерфейса' })).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.language)).toBe('ru');

    await userEvent.click(screen.getByRole('radio', { name: 'Oʻzbekcha' }));
    expect(i18n.t('upload.title')).toBe('Maqolani yuklash');
  });
});
