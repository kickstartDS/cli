import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import runTask from '../../tasks/cms/staticcms-task.js';

const staticcms = new Command('staticcms')
  .description(
    chalkTemplate`Generates {bold Static CMS} configuration from your {bold JSON Schema} component definitions`
  )
  .option(
    '--schema-paths <paths...>',
    chalkTemplate`paths to your JSON Schema component definitions, default {bold ./src/components}`,
    ['src/components']
  )
  .option(
    '--layer-order <order...>',
    chalkTemplate`order of layers in processing, default {bold ['cms', 'schema']}`,
    ['cms', 'schema']
  )
  .option(
    '--configuration-path <path>',
    chalkTemplate`relative path from project root to the folder where your generated configuration should be stored, default {bold ./src/cms}`,
    'src/cms'
  )
  .option(
    '--update-config',
    chalkTemplate`whether to update existing config if it exists, or overwrite it, default {bold true}`,
    true
  )
  .option(
    '--templates <templateNames...>',
    chalkTemplate`components to classify as page templates`,
    ['page', 'blog-post']
  )
  .option(
    '--globals <globalNames...>',
    chalkTemplate`components to classify as global components`,
    ['settings', 'blog-overview']
  )
  .option(
    '--components <componentNames...>',
    chalkTemplate`components to classify as bloks`,
    [
      'cta',
      'faq',
      'features',
      'gallery',
      'image-text',
      'logos',
      'stats',
      'teaser-card',
      'testimonials',
      'text',
      'header',
      'footer',
      'seo',
      'blog-teaser',
    ]
  )
  .option(
    '--rc-only',
    chalkTemplate`only read configuration from {bold .schema-staticcmsrc.json}, skip prompts`,
    true
  )
  .option(
    '--revert',
    chalkTemplate`revert command defined by {bold .schema-staticcmsrc.json}, implies {bold --rc-only}`,
    false
  )
  .option('--cleanup', 'clean up tmp dirs before running', true)
  .option('--debug', 'show debugging output', false)
  .action((options) => {
    runTask(
      options.schemaPaths,
      options.layerOrder,
      options.configurationPath,
      options.updateConfig,
      options.templates,
      options.globals,
      options.components,
      options.rcOnly,
      options.revert,
      options.cleanup,
      options.debug
    );
  });

export default staticcms;
