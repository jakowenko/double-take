const fs = require('fs');
const yaml = require('js-yaml');
const { STORAGE, UI } = require('.')();

const themes = {
  ui: [
    'arya-purple',
    'arya-blue',
    'arya-green',
    'arya-orange',
    'bootstrap4-dark-blue',
    'bootstrap4-dark-purple',
    'bootstrap4-light-blue',
    'bootstrap4-light-purple',
    'fluent-light',
    'luna-amber',
    'luna-blue',
    'luna-green',
    'luna-pink',
    'md-dark-deeppurple',
    'md-dark-indigo',
    'md-light-deeppurple',
    'md-light-indigo',
    'mdc-dark-deeppurple',
    'mdc-dark-indigo',
    'mdc-light-deeppurple',
    'mdc-light-indigo',
    'mira',
    'nano',
    'nova',
    'nova-accent',
    'nova-alt',
    'nova-vue',
    'rhea',
    'saga-blue',
    'saga-green',
    'saga-orange',
    'saga-purple',
    'soho-light',
    'soho-dark',
    'tailwind-light',
    'vela-blue',
    'vela-green',
    'vela-orange',
    'vela-purple',
    'viva-light',
    'viva-dark',
  ],
  editor: [
    'ambiance',
    'chaos',
    'chrome',
    'clouds_midnight',
    'clouds',
    'cobalt',
    'crimson_editor',
    'dawn',
    'dracula',
    'dreamweaver',
    'eclipse',
    'github',
    'gob',
    'gruvbox',
    'idle_fingers',
    'iplastic',
    'katzenmilch',
    'kr_theme',
    'kuroir',
    'merbivore_soft',
    'merbivore',
    'mono_industrial',
    'monokai',
    'nord_dark',
    'pastel_on_dark',
    'solarized_dark',
    'solarized_light',
    'sqlserver',
    'terminal',
    'textmate',
    'tomorrow_night_blue',
    'tomorrow_night_bright',
    'tomorrow_night_eighties',
    'tomorrow_night',
    'tomorrow',
    'twilight',
    'vibrant_ink',
    'xcode',
  ],
};

module.exports.ui = {
  get: () => {
    try {
      const values = yaml.load(fs.readFileSync(`${STORAGE.PATH}/.ui`, 'utf8'));
      if (values) {
        values.theme = themes.ui.includes(values.theme) ? values.theme : UI.THEME;
        values.editor.theme = themes.editor.includes(values.editor.theme)
          ? values.editor.theme
          : UI.EDITOR.THEME;
      }
      return values || false;
    } catch (error) {
      return false;
    }
  },
  create: (values = {}) => {
    const current = this.ui.get();
    if (!current) fs.writeFileSync(`${STORAGE.PATH}/.ui`, yaml.dump(values));
    return current || values;
  },
  set: (values = {}) => {
    fs.writeFileSync(`${STORAGE.PATH}/.ui`, yaml.dump({ ...this.ui.get(), ...values }));
    return values;
  },
};
