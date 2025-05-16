/**
 * ESLint configuration for OrderForecast project
 */

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: [
    'jest'
  ],
  rules: {
    // Possible errors
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'warn',
    'no-duplicate-case': 'error',
    'no-empty': 'warn',
    'no-extra-semi': 'warn',
    'no-irregular-whitespace': 'warn',
    
    // Best practices
    'curly': ['warn', 'multi-line'],
    'default-case': 'warn',
    'dot-notation': 'warn',
    'eqeqeq': ['error', 'always', { 'null': 'ignore' }],
    'no-alert': 'warn',
    'no-else-return': 'warn',
    'no-empty-function': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-multi-spaces': 'warn',
    'no-return-assign': 'warn',
    'no-useless-return': 'warn',
    'yoda': 'warn',
    
    // Variables
    'no-unused-vars': ['warn', { 
      'vars': 'all', 
      'args': 'after-used',
      'ignoreRestSiblings': true,
      'argsIgnorePattern': '^_'
    }],
    'no-use-before-define': ['error', { 'functions': false }],
    
    // Stylistic issues
    'array-bracket-spacing': ['warn', 'never'],
    'block-spacing': ['warn', 'always'],
    'brace-style': ['warn', '1tbs', { 'allowSingleLine': true }],
    'comma-dangle': ['warn', 'only-multiline'],
    'comma-spacing': ['warn', { 'before': false, 'after': true }],
    'comma-style': ['warn', 'last'],
    'computed-property-spacing': ['warn', 'never'],
    'func-call-spacing': ['warn', 'never'],
    'indent': ['warn', 2, { 'SwitchCase': 1 }],
    'key-spacing': ['warn', { 'beforeColon': false, 'afterColon': true }],
    'keyword-spacing': ['warn', { 'before': true, 'after': true }],
    'linebreak-style': ['warn', 'unix'],
    'max-len': ['warn', { 
      'code': 100, 
      'ignoreComments': true,
      'ignoreUrls': true,
      'ignoreStrings': true,
      'ignoreTemplateLiterals': true
    }],
    'no-lonely-if': 'warn',
    'no-mixed-spaces-and-tabs': 'warn',
    'no-multiple-empty-lines': ['warn', { 'max': 2, 'maxEOF': 1 }],
    'no-trailing-spaces': 'warn',
    'object-curly-spacing': ['warn', 'always'],
    'quotes': ['warn', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': true }],
    'semi': ['warn', 'always'],
    'semi-spacing': ['warn', { 'before': false, 'after': true }],
    'space-before-blocks': ['warn', 'always'],
    'space-before-function-paren': ['warn', {
      'anonymous': 'always',
      'named': 'never',
      'asyncArrow': 'always'
    }],
    'space-in-parens': ['warn', 'never'],
    'space-infix-ops': 'warn',
    
    // ES6
    'arrow-spacing': ['warn', { 'before': true, 'after': true }],
    'no-duplicate-imports': 'error',
    'no-var': 'warn',
    'prefer-const': 'warn',
    'prefer-template': 'warn',
    
    // Jest plugin rules
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/valid-expect': 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      rules: {
        'no-unused-expressions': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    '*.min.js'
  ]
};
