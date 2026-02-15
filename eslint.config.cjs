const globals = require('globals')
const js = require('@eslint/js')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')

const baseRules = {
  'no-console': 'off',
  'no-var': 'error',
  'prefer-const': 'error',
  quotes: ['error', 'single'],
  semi: ['error', 'never'],
  indent: ['error', 2],
  'max-len': ['error', 250],
  'no-process-env': 'error',
}

module.exports = [
  // JavaScript files
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 13,
      sourceType: 'commonjs',
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
    },
    rules: {
      ...baseRules,
      'global-require': 'error',
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
      }],
    },
  },
  // TypeScript files
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 13,
      },
    },
    rules: {
      ...baseRules,
      // Disable JS rules superseded by TS equivalents
      'no-unused-vars': 'off',
      'no-undef': 'off',
      // TypeScript-aware equivalents
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
]
