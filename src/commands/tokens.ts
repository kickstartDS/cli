import { program } from 'commander';
import { getLogger } from '../logging.js';
import init from './tokens/init.js';

const logger = getLogger('tokens');

logger.debug('executing a command of tokens');

program.addCommand(init).parse(process.argv);
