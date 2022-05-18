import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import runTask from '../../tasks/tokens/compile-task.js';

const init = new Command('compile')
  .description(
    chalkTemplate`compiles kickstartDS compatible Style Dictionary configuration to css and assets, ready to use in your {#ecff00.bold kickstartDS} Design System`
  )
  .option(
    '--rc-only',
    chalkTemplate`only read configuration from {bold .tokens-compilerc.json}, skip prompts`,
    false
  )
  .option(
    '--revert',
    chalkTemplate`revert command defined by {bold .tokens-compilerc.json}, implies {bold --rc-only}`,
    false
  )
  .option('--cleanup', 'clean up tmp dirs before running', true)
  .option('--debug', 'show debugging output', false)
  .action((options) => {
    runTask(options.rcOnly, options.revert, options.cleanup, options.debug);
  });

export default init;
