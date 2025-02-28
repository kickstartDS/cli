import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import runTask from '../../tasks/schema/dereference-task.js';

const dereference = new Command('dereference')
  .description(
    chalkTemplate`Dereferences {bold JSON Schema} component definitions, (mainly) inlining all $ref references in the process`
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
    chalkTemplate`only read configuration from {bold .schema-dereferencerc.json}, skip prompts`,
    true
  )
  .option(
    '--revert',
    chalkTemplate`revert command defined by {bold .schema-dereferencerc.json}, implies {bold --rc-only}`,
    false
  )
  .option('--cleanup', 'clean up tmp dirs before running', true)
  .option('--debug', 'show debugging output', false)
  .action((options) => {
    runTask(
      options.componentsPath,
      options.cmsPath,
      options.defaultPageSchema,
      options.layerKickstartdsComponents,
      options.rcOnly,
      options.revert,
      options.cleanup,
      options.debug
    );
  });

export default dereference;
