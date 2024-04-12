import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import runTask from '../../tasks/cms/uniform-task.js';

const uniform = new Command('uniform')
  .description(
    chalkTemplate`Generates {bold Uniform} configuration from your {bold JSON Schema} component definitions`
  )
  .option(
    '--components-path <path>',
    chalkTemplate`relative path from project root to your components directory, default {bold ./src/components}`,
    'src/components'
  )
  .option(
    '--configuration-path <path>',
    chalkTemplate`relative path from project root to the folder where your generated configuration should be stored, default {bold ./src/cms}`,
    'src/cms'
  )
  .option(
    '--templates <templateNames...>',
    chalkTemplate`components to classify as page templates`,
    ['page', 'blog-post', 'blog-overview', 'settings']
  )
  .option(
    '--globals <globalNames...>',
    chalkTemplate`components to classify as global components`,
    ['header', 'footer', 'seo']
  )
  .option(
    '--rc-only',
    chalkTemplate`only read configuration from {bold .schema-uniformrc.json}, skip prompts`,
    true
  )
  .option(
    '--revert',
    chalkTemplate`revert command defined by {bold .schema-uniformrc.json}, implies {bold --rc-only}`,
    false
  )
  .option('--cleanup', 'clean up tmp dirs before running', true)
  .option('--debug', 'show debugging output', false)
  .action((options) => {
    runTask(
      options.componentsPath,
      options.configurationPath,
      options.templates,
      options.globals,
      options.rcOnly,
      options.revert,
      options.cleanup,
      options.debug
    );
  });

export default uniform;
