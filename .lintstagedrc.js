module.exports = {
  '*.js': ['npm run lint:eslint', 'npm run lint:prettier'],
  '{!(package)*.json,*.code-snippets,.!(browserslist)*rc}': [
    'npm run lint:prettier -- --parser json',
  ],
  'package.json': ['npm run lint:prettier'],
};
