import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import runTask from '../../tasks/tokens/init-task.js';

const init = new Command('init')
  .description(
    chalkTemplate`converts {bold token-primitives.json} to Style Dictionary configuration, ready to use in your {#ecff00.bold kickstartDS} Design System`
  )
  .option(
    '--token-path <path>',
    chalkTemplate`relative path from project root to your token dictionary, default {bold src/token/dictionary}`,
    'src/token/dictionary',
  )
  .option(
    '--rc-only',
    chalkTemplate`only read configuration from {bold .tokens-initrc.json}, skip prompts`,
    false
  )
  .option(
    '--revert',
    chalkTemplate`revert command defined by {bold .tokens-initrc.json}, implies {bold --rc-only}`,
    false
  )
  .option('--cleanup', 'clean up tmp dirs before running', true)
  .option('--debug', 'show debugging output', false)
  .action((options) => {
    runTask(
      options.tokenPath,
      options.rcOnly,
      options.revert,
      options.cleanup,
      options.debug,
    );
  });

export default init;
