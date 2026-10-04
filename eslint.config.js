import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/**
 * FSD layer boundaries: a layer may only import from layers below it.
 * Order (low → high): shared, entities, features, widgets, pages, app.
 */
const layers = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];
const boundaryRules = layers.map((layer, index) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          ...layers.slice(index + 1).map((higher) => ({
            group: [`@/${higher}/*`, `@/${higher}`],
            message: `FSD: "${layer}" must not import from higher layer "${higher}".`,
          })),
          ...(layer !== 'shared' && layer !== 'app'
            ? [
                {
                  group: [`@/${layer}/*/*`, '!@/shared/**'],
                  message: 'FSD: import slices through their public API (index.ts).',
                },
              ]
            : []),
        ],
      },
    ],
  },
}));

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['buttonVariants', 'toast'] },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      // noUncheckedIndexedAccess is on; `!` is used only after explicit length/guard checks.
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  ...boundaryRules,
);
