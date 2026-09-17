/**
 * @file .eslintrc.js
 * @module Config
 * @desc ESLint configuration for the Care4U backend.
 * @author Wasana Karunanayaka (S/21/081)
 */

module.exports = {
  env: { browser: true, es2021: true, node: true },
  extends: ['eslint:recommended'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error'
  }
};
