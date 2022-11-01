import { program } from 'commander';
import { getLogger } from '../logging.js';

import init from './tokens/init.js';
import compile from './tokens/compile.js';
import tofigma from './tokens/tofigma.js';

const logger = getLogger('tokens');

logger.debug('executing a command of tokens');

program
  .addCommand(init)
  .addCommand(compile)
  .addCommand(tofigma)
  .parse(process.argv);
