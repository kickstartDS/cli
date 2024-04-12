import { program } from 'commander';
import { getLogger } from '../logging.js';
import storyblok from './cms/storyblok.js';
import uniform from './cms/uniform.js';
import stackbit from './cms/stackbit.js';
import staticcms from './cms/staticcms.js';

const logger = getLogger('cms');

logger.debug('executing a command of cms');

program
  .addCommand(storyblok)
  .addCommand(uniform)
  .addCommand(stackbit)
  .addCommand(staticcms)
  .parse(process.argv);
