module.exports = {
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  htmlWhitespaceSensitivity: 'css',
  jsxBracketSameLine: false,
  jsxSingleQuote: true,
  printWidth: 120,
  proseWrap: 'never',
  quoteProps: 'as-needed',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
  vueIndentScriptAndStyle: false,
  overrides: [
    {
      files: '*.html',
      options: {
        parser: 'html',
      },
    },
  ],
};
