import { Command } from 'commander';
import { getLogger } from '../../logging.js';
import completion from '../../completion.js';

const logger = getLogger('completions').child({ command: 'remove' });
const remove = new Command('remove');

const removeShellCompletions = () => {
  logger.info('removing kickstartDS CLI completions from local shell');

  try {
    completion.cleanupShellInitFile();
  } catch (err) {
    logger.error("can't remove shell integration, unknown shell", err);
  }
};

remove
  .description('remove kickstartDS CLI completions from local shell')
  .action(removeShellCompletions);

export default remove;
