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
    'src/components'
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
    '--type-naming <naming>',
    chalkTemplate`whether types should be named by "title" or "id"`,
    'title'
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
      options.schemaPaths,
      options.layerOrder,
      options.mergeSchemas,
      options.defaultPageSchema,
      options.layerKickstartdsComponents,
      options.typeNaming,
      options.rcOnly,
      options.revert,
      options.cleanup,
      options.debug
    );
  });

export default types;
