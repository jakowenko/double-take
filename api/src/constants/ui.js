const fs = require('fs');
const yaml = require('js-yaml');
const { STORAGE } = require('.');

module.exports.ui = {
  get: () => {
    try {
      const values = yaml.load(fs.readFileSync(`${STORAGE.PATH}/.ui`, 'utf8'));
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
