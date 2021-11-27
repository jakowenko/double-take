// https://github.com/nodeca/js-yaml/blob/master/examples/handle_unknown_types.js
const yaml = require('js-yaml');

module.exports = () => {
  const tags = ['scalar', 'sequence', 'mapping'].map((kind) => {
    // first argument here is a prefix, so this type will handle anything starting with !
    return new yaml.Type('!', {
      kind,
      multi: true,
      construct(data, type) {
        return `${type} ${data}`;
      },
    });
  });

  return yaml.DEFAULT_SCHEMA.extend(tags);
};
