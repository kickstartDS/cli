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
    'src/components',
  )
  .option(
    '--schema-domain <domain>',
    chalkTemplate`{bold domain} used in your JSON Schema {bold $id} fields, e.g. "schema.mydomain.com"`,
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
      options.schemaDomain,
      options.rcOnly,
      options.revert,
      options.cleanup,
      options.debug,
    );
  });

export default dereference;
