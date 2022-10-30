import { program } from 'commander';
import { getLogger } from '../logging.js';
import types from './schema/types.js';
import dereference from './schema/dereference.js';

const logger = getLogger('schema');

logger.debug('executing a command of schema');

program.addCommand(types).addCommand(dereference).parse(process.argv);
