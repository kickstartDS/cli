import { Command } from 'commander';
import chalkTemplate from 'chalk-template';
import { getLogger } from '../../logging.js';
import completion from '../../completion.js';

const logger = getLogger('completions').child({ command: 'remove' });

const removeShellCompletions = () => {
  logger.info(
    chalkTemplate`removing {#ecff00.bold kickstartDS} {bold CLI} completions from local shell`
  );

  try {
    completion.cleanupShellInitFile();
  } catch (err) {
    logger.error("can't remove shell integration, unknown shell", err);
  }
};

const remove = new Command('remove')
  .description(
    chalkTemplate`remove {#ecff00.bold kickstartDS} {bold CLI} completions from local shell`
  )
  .action(removeShellCompletions);

export default remove;
