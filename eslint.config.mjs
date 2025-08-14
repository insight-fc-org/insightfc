// eslint.config.mjs
import configPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // 1) Global ignores for the whole workspace
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.pnpm-store/**',
    ],
  },

  // 2) TypeScript recommended rules (flat config)
  ...tseslint.configs.recommended,

  // 3) Workspace-level language options and Node globals
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },

  // 4) Test file overrides (Vitest globals)
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
      },
    },
  },

  // 5) Turn off stylistic rules that conflict with Prettier
  configPrettier,
];
