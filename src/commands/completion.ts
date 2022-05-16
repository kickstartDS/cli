import { program } from 'commander';
import { getLogger } from '../logging.js';
import install from './completions/install.js';
import remove from './completions/remove.js';

const logger = getLogger('completions');

logger.debug('executing a command of completions');

program.addCommand(install).addCommand(remove).parse(process.argv);
