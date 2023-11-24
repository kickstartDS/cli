import { program } from 'commander';
import { getLogger } from '../logging.js';
import storyblok from './cms/storyblok.js';
import uniform from './cms/uniform.js';

const logger = getLogger('cms');

logger.debug('executing a command of cms');

program.addCommand(storyblok).addCommand(uniform).parse(process.argv);
