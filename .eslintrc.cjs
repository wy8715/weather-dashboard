/**
 * ESLint 配置文件
 * @description 遵循 AGENTS.md 规范，配置 @typescript-eslint 和 react/recommended 规则
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // 禁止使用 any 类型
    '@typescript-eslint/no-explicit-any': 'error',
    // 禁止未使用变量（函数参数以 _ 开头可豁免）
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // React 17+ JSX Transform 不需要 import React
    'react/react-in-jsx-scope': 'off',
  },
  ignorePatterns: ['dist', 'node_modules', 'server'],
};
