import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import runTask from '../../tasks/tokens/tofigma-task.js';

const init = new Command('tofigma')
  .description(
    chalkTemplate`transfers {#ecff00.bold kickstartDS} compatible Style Dictionary configuration to {#ecff00.bold kickstartDS} compatible Figma file`
  )
  .option(
    '--rc-only',
    chalkTemplate`only read configuration from {bold .tokens-tofigmarc.json}, skip prompts`,
    false
  )
  .option(
    '--revert',
    chalkTemplate`revert command defined by {bold .tokens-tofigmarc.json}, implies {bold --rc-only}`,
    false
  )
  .option('--cleanup', 'clean up tmp dirs before running', true)
  .option('--debug', 'show debugging output', false)
  .action((options) => {
    runTask(options.rcOnly, options.revert, options.cleanup, options.debug);
  });

export default init;
