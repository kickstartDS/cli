import winston from 'winston';
import fsExtra from 'fs-extra';
import { dirname } from 'path';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';
import { IStoryblokBlock } from '@kickstartds/jsonschema2storyblok';

const writeFile = fsExtra.writeFile;
const readJSON = fsExtra.readJSON;

const moduleName = 'cms';
const command = 'storyblok';
const requiredCommands: string[] = [];

const {
  init: taskInit,
  start: taskStart,
  util: taskUtil,
} = createTask(moduleName, command);

const { shell: taskUtilShell, schema: taskUtilSchema, getLogger } = taskUtil;

const {
  helper: { requireCommands: shellRequireCommands },
} = taskUtilShell;

const {
  helper: {
    toStoryblok: schemaToStoryblok,
    toStoryblokConfig: schemaToStoryblokConfig,
  },
} = taskUtilSchema;

const run = async (
  componentsPath: string = 'src/components',
  cmsPath: string,
  configurationPath: string = 'src/cms',
  updateConfig: boolean = true,
  templates: string[] = ['page', 'blog-post', 'blog-overview', 'settings'],
  globals: string[] = ['header', 'footer', 'seo'],
  components: string[] = [
    'cta',
    'faq',
    'features',
    'gallery',
    'image-text',
    'logos',
    'stats',
    'teaser-card',
    'testimonials',
    'text',
    'blog-teaser',
  ],
  rcOnly: boolean,
  isRevert: boolean,
  shouldCleanup: boolean,
  debugActive: boolean
): Promise<void> => {
  const callingPath: string = process.cwd();

  const check = async (logger: winston.Logger): Promise<boolean> => {
    logger.info('checking prerequesites before starting');

    shellRequireCommands(requiredCommands);

    logger.info('prerequesites met, starting');
    return true;
  };

  const storyblok = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold storyblok} subtask`);

    const customSchemaGlob = `${callingPath}/${componentsPath}/**/*.(schema|definitions|interface).json`;
    const globs = [customSchemaGlob];
    if (cmsPath) {
      globs.push(`${callingPath}/${cmsPath}/**/*.schema.json`);
    }
    const elements = await schemaToStoryblok(
      globs,
      templates,
      globals,
      components
    );

    shell.mkdir('-p', `${shell.pwd()}/${configurationPath}/`);

    // the following `if` section is only a stub for now, not actually doing anything yet
    if (updateConfig) {
      const currentConfig: { components: IStoryblokBlock[] } = await readJSON(
        `${callingPath}/${configurationPath}/components.123456.json`
      );

      for (const element of [
        ...elements.components,
        ...elements.globals,
        ...elements.templates,
      ]) {
        const component = currentConfig.components.find(
          (component) => component.name === (element as IStoryblokBlock).name
        );
      }
    }

    const configStringStoryblok = await schemaToStoryblokConfig(elements);

    await writeFile(
      `${shell.pwd()}/${configurationPath}/components.123456.json`,
      configStringStoryblok
    );

    shell.cp(
      `-r`,
      `${shell.pwd()}/${configurationPath}`,
      `${callingPath}/${dirname(configurationPath)}/`
    );

    logger.info(
      chalkTemplate`finished running the {bold storyblok} subtask successfully`
    );
    return true;
  };

  const storyblokRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold storyblok} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold storyblok} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [storyblok],
    revert: [storyblokRevert],
  };

  const typesVariable = 'storyblok-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command,
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} storyblok command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: storyblok command with types variable {bold ${typesVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(typesVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} storyblok command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: storyblok command with types variable {bold ${typesVariable}}`
    );
};

export default run;
