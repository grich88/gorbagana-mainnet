module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  globals: {
    BigInt: 'readonly',
    BigUint64Array: 'readonly'
  },
  env: {
    es2020: true,
    browser: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
}; 