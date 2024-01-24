import { program } from 'commander';
import { getLogger } from '../logging.js';
import types from './schema/types.js';
import layer from './schema/layer.js';
import dereference from './schema/dereference.js';
import presets from './schema/presets.js';

const logger = getLogger('schema');

logger.debug('executing a command of schema');

program
  .addCommand(types)
  .addCommand(dereference)
  .addCommand(layer)
  .addCommand(presets)
  .parse(process.argv);
