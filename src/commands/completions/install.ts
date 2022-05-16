import { Command } from 'commander';
import { getLogger } from '../../logging.js';
import completion from '../../completion.js';

const logger = getLogger('completions').child({ command: 'install' });
const install = new Command('install');

const installShellCompletions = () => {
  logger.info('installing kickstartDS CLI completions in local shell');

  try {
    completion.setupShellInitFile();
  } catch (err) {
    logger.error("can't set up shell integration, unknown shell", err);
  }
};

install
  .description('install kickstartDS CLI completions in local shell')
  .action(installShellCompletions);

export default install;
