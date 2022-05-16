import { Command } from 'commander';
import runTask from '../../tasks/example/example-task.js';

// add name of your command here
const demo = new Command('demo');

// CLI configuration for command
demo
  .description('demos usage of commands, and how to create your own')
  .option(
    '--rc-only',
    'only read configuration from .example-demorc.json, skip prompts',
    false
  )
  .option(
    '--revert',
    'revert command defined by .example-demorc.json, implies --rc-only',
    false
  )
  .option('--cleanup', 'clean up tmp dirs before running', true)
  .option('--debug', 'show debugging output', false)
  .action((options) => {
    // eslint-disable-next-line global-require
    // const demoTask = require('../../tasks/example/example-task');
    runTask(options.rcOnly, options.revert, options.cleanup, options.debug);
  });

export default demo;
