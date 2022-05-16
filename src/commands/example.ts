import { program } from 'commander';
import { getLogger } from '../logging.js';
import demo from './example/demo.js';

const logger = getLogger('example');

logger.debug('executing a command of example');

// TODO re-add completion
// require('../../src/completion');

program.addCommand(demo).parse(process.argv);
