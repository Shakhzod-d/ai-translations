import en from './locales/en.json';
import ru from './locales/ru.json';
import uz from './locales/uz.json';

const keys = (obj: object, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

/** Plural suffixes legitimately differ by language (ru has _few/_many). */
const normalize = (list: string[]) =>
  [...new Set(list.map((k) => k.replace(/_(one|few|many|other)$/, '')))].sort();

describe('locales', () => {
  it.each([
    ['uz', uz],
    ['ru', ru],
  ])('%s has exactly the same keys as en', (_lng, locale) => {
    expect(normalize(keys(locale))).toEqual(normalize(keys(en)));
  });
});
