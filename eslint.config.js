import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist', 'release-final', 'node_modules', 'coverage', 'docs/images'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Application source (browser + React)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Vite / Vitest configs run in Node and are TypeScript ESM
  {
    files: ['vite.config.ts', 'vitest.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Electron main process and CommonJS helper scripts
  {
    files: ['main.js', 'scripts/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      // CommonJS files legitimately use require()
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Test files run under Vitest (Node) and use its globals
  {
    files: ['test/**/*.ts', 'test/**/*.tsx'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Must come last: turn off stylistic rules that conflict with Prettier
  prettier
);
