module.exports = {
  root: true,
  env: {
    amd: true,
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  rules: {
    'linebreak-style': 0,
    'no-console': 0,
    'no-plusplus': 0,
    'max-len': 0,
    'no-return-assign': 0,
    'no-await-in-loop': 0,
    indent: 0, // Allowing prettier to handle this
    'consistent-return': 0,
    'comma-dangle': 0,
    'operator-linebreak': 0,
    'implicit-arrow-linebreak': 0,
    'function-paren-newline': 0,
    'object-curly-newline': 0,
    'newline-per-chained-call': 0,
    'prettier/prettier': 'error',
    'no-param-reassign': 0,
    'no-restricted-syntax': 0,
    'no-nested-ternary': 0,
  },
};
