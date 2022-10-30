import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import runTask from '../../tasks/schema/types-task.js';

const types = new Command('types')
  .description(
    chalkTemplate`Generates {bold TypeScript} type definitions from your {bold JSON Schema} component definitions`
  )
  .option(
    '--components-path <path>',
    chalkTemplate`relative path from project root to your components directory, default {bold ./src/components}`,
  )
  .option(
    '--rc-only',
    chalkTemplate`only read configuration from {bold .schema-typesrc.json}, skip prompts`,
    false
  )
  .option(
    '--revert',
    chalkTemplate`revert command defined by {bold .schema-typesrc.json}, implies {bold --rc-only}`,
    false
  )
  .option('--cleanup', 'clean up tmp dirs before running', true)
  .option('--debug', 'show debugging output', false)
  .action((options) => {
    runTask(
      options.componentsPath,
      options.rcOnly,
      options.revert,
      options.cleanup,
      options.debug,
    );
  });

export default types;
