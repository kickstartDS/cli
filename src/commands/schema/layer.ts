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
    '--cms-path <path>',
    chalkTemplate`relative path from project root to your cms specific components directory, default {bold ./src/components}`
  )
  .option(
    '--types-path <path>',
    chalkTemplate`relative path from project root to your types directory, default {bold ./src/types}`,
    'src/types'
  )
  .option(
    '--merge-schemas',
    chalkTemplate`merge allOf declarations in processed {bold JSON Schemas} / {bold component APIs}, default {bold false}`,
    false
  )
  .option(
    '--no-default-page-schema',
    chalkTemplate`disable load of default page schema, default {bold false}`
  )
  .option(
    '--layer-kickstartds-components',
    chalkTemplate`whether kickstartDS base components should be layered`,
    true
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
      options.cmsPath,
      options.typesPath,
      options.mergeSchemas,
      options.defaultPageSchema,
      options.layerKickstartdsComponents,
      options.rcOnly,
      options.revert,
      options.cleanup,
      options.debug
    );
  });

export default types;
