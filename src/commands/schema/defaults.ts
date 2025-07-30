import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import runTask from '../../tasks/schema/defaults-task.js';

const defaults = new Command('defaults')
  .description(
    chalkTemplate`Creates default objects for {bold JSON Schema} component definitions`
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
    chalkTemplate`only read configuration from {bold .schema-defaultsrc.json}, skip prompts`,
    true
  )
  .option(
    '--revert',
    chalkTemplate`revert command defined by {bold .schema-defaultsrc.json}, implies {bold --rc-only}`,
    false
  )
  .option('--cleanup', 'clean up tmp dirs before running', true)
  .option('--debug', 'show debugging output', false)
  .action((options) => {
    runTask(
      options.schemaPaths,
      options.layerOrder,
      options.defaultPageSchema,
      options.layerKickstartdsComponents,
      options.rcOnly,
      options.revert,
      options.cleanup,
      options.debug
    );
  });

export default defaults;
