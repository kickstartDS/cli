import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import { getLogger } from '../../logging.js';
import completion from '../../completion.js';

const logger = getLogger('completions').child({ command: 'install' });

const installShellCompletions = () => {
  logger.info(
    chalkTemplate`installing {#ecff00.bold kickstartDS} {bold CLI} completions in local shell`
  );

  try {
    completion.setupShellInitFile();
  } catch (err) {
    logger.error("can't set up shell integration, unknown shell", err);
  }
};

const install = new Command('install')
  .description(
    chalkTemplate`install {#ecff00.bold kickstartDS} {bold CLI} completions in local shell`
  )
  .action(installShellCompletions);

export default install;
