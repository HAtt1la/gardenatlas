import js from '@eslint/js';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [
  {
    ignores: ['dist/', 'node_modules/', '*.config.js', 'public/sw.js', '.svelte-kit/'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'warn',
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      sourceType: 'module',
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      svelte: sveltePlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sveltePlugin.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'warn',
    },
  },
];
