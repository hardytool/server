const globals = require('globals')
const js = require('@eslint/js')

const {
  FlatCompat,
} = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

module.exports = [...compat.extends('eslint:recommended'), {
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
    'global-require': 'error',
    indent: ['error', 2],
    'max-len': ['error', 250],
    'no-console': 'off',
    'no-process-env': 'error',

    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
    }],

    'no-var': 'error',
    'prefer-const': 'error',
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
  },
}]