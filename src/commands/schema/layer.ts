import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import runTask from '../../tasks/schema/layer-task.js';

const types = new Command('layer')
  .description(
    chalkTemplate`Layers kickstartDS {bold TypeScript} type definitions using your {bold JSON Schema} component definitions`
  )
  .option(
    '--components-path <path>',
    chalkTemplate`relative path from project root to your components directory, default {bold ./src/components}`,
    'src/components'
  )
  .option(
    '--types-path <path>',
    chalkTemplate`relative path from project root to your types directory, default {bold ./src/types}`,
    'src/types'
  )
  .option(
    '--rc-only',
    chalkTemplate`only read configuration from {bold .schema-typesrc.json}, skip prompts`,
    true
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
      options.typesPath,
      options.rcOnly,
      options.revert,
      options.cleanup,
      options.debug
    );
  });

export default types;
