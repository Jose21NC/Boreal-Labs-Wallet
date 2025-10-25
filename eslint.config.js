import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'ios', 'android']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Ignora variables en mayúsculas, subrayado, y alias comunes de framer-motion (m/motion)
      'no-unused-vars': ['error', { varsIgnorePattern: '^(?:[A-Z_]|m$|motion$)' }],
    },
  },
  {
    files: ['vite.config.js', 'tailwind.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
