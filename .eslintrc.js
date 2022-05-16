const path = require('path');
const config = require('@kickstartds/eslint-config');

// TODO check if that `import/resolver` can just go
// no monorepo-setup here, but maybe needs a resolver for `src/`?
module.exports = {
  extends: '@kickstartds/eslint-config',
  settings: {
    // 'import/resolver': {
    //   ...config.settings['import/resolver'],
    //   'eslint-import-resolver-lerna': {
    //     packages: path.resolve(__dirname, 'packages/components'),
    //   },
    // },
  },
  rules: {
    "import/no-unresolved": "off"
  }
};
