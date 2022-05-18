import { program } from 'commander';
import { getLogger } from '../logging.js';
import init from './tokens/init.js';
import compile from './tokens/compile.js';

const logger = getLogger('tokens');

// TODO add missing tasks:
// * specify
// * template

logger.debug('executing a command of tokens');

program.addCommand(init).addCommand(compile).parse(process.argv);
