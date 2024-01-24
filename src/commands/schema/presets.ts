import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import runTask from '../../tasks/schema/presets-task.js';

const presets = new Command('presets')
  .description(
    chalkTemplate`Extracts kickstartDS {bold TypeScript} component presets for your {bold JSON Schema} component definitions`
  )
  .option(
    '--components-path <path>',
    chalkTemplate`relative path from project root to your components directory, default {bold ./src/components}`,
    'src/components'
  )
  .option(
    '--presets-path <path>',
    chalkTemplate`relative path from project root to your presets directory, default {bold ./src/presets}`,
    'src/presets'
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
      options.presetsPath,
      options.rcOnly,
      options.revert,
      options.cleanup,
      options.debug
    );
  });

export default presets;
