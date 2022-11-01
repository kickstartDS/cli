import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import runTask from '../../tasks/example/example-task.js';

const demo = new Command('demo')
  .description(
    'demos usages of commands, template and orientation to create your own'
  )
  .option(
    '--rc-only',
    chalkTemplate`only read configuration from {bold .example-demorc.json}, skip prompts`,
    true
  )
  .option(
    '--revert',
    chalkTemplate`revert command defined by {bold .example-demorc.json}, implies {bold --rc-only}`,
    false
  )
  .option('--cleanup', 'clean up tmp dirs before running', true)
  .option('--debug', 'show debugging output', false)
  .action((options) => {
    runTask(options.rcOnly, options.revert, options.cleanup, options.debug);
  });

export default demo;
