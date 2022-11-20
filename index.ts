import figlet from 'figlet';
import chalkTemplate from 'chalk-template';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import { readFileSync } from 'fs';
import { getLogger } from './src/logging.js';

// TODO seems to fail currently when called without options directly
// even adding `-h` fixes errors (exit 1)

import './src/completion.js';

const cliRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(
  readFileSync(`${cliRoot}/package.json`).toString()
);

// TODO handle light / dark mode for colors
// eslint-disable-next-line no-console
console.log(
  chalkTemplate`{#ecff00.bold ${figlet.textSync('kickstartDS', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  })}}\n{rgb(44,124,143).bold ${figlet.textSync('.CLI.', {
    font: 'Slant Relief',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  })}}\n\nVersion: {bold ${
    packageJson.version
  }}\n{green For more information visit: }\n{blue https://www.kickstartds.com/docs/intro/cli/}\n\nStarting...`
);

// TODO this debugging switch does not work right now
const logger = getLogger('general', 'info', true, false);
logger.info('welcome to the kickstartDS CLI');

program
  .name('kickstartDS')
  .version(packageJson.version)
  .usage('<command> [options]')
  .option('-d, --debug', 'show debug info');

// TODO completions are not working, yet
program.command('tokens', 'initialize, build and convert your design tokens', {
  executableFile: `${cliRoot}/dist/src/commands/tokens.js`
});
program.command('schema', 'generate types or dereference component JSON Schema', {
  executableFile: `${cliRoot}/dist/src/commands/schema.js`
});
program.command('completion', 'kickstartDS CLI shell autocompletion', {
  executableFile: `${cliRoot}/dist/src/commands/completion.js`
});
program.command('example', 'example commands as orientation', {
  executableFile: `${cliRoot}/dist/src/commands/example.js`
});

// TODO currently not working?!
program.on('*', () => {
  logger.warn(`unknown command: ${program.args.join(' ')}`);
  program.help();
});

// TODO `program.debug` somehow vanished... maybe needs a backup plan
// if (program.debug) logger.debug(program.opts());

program.parse(process.argv);
