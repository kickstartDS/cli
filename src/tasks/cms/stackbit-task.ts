import winston from 'winston';
import fsExtra from 'fs-extra';
import { dirname } from 'path';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';
import { ObjectModel } from '@stackbit/types';

const writeFile = fsExtra.writeFile;
const readJSON = fsExtra.readJSON;

const moduleName = 'cms';
const command = 'stackbit';
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
    toStackbit: schemaToStackbit,
    toStackbitConfig: schemaToStackbitConfig,
  },
} = taskUtilSchema;

const run = async (
  componentsPath: string = 'src/components',
  cmsPath: string,
  configurationPath: string = 'src/cms',
  updateConfig: boolean = true,
  templates: string[] = ['page', 'blog-post'],
  globals: string[] = ['blog-overview', 'settings'],
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
    'header',
    'footer',
    'seo',
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

  const stackbit = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold stackbit} subtask`);

    const customSchemaGlob = `${callingPath}/${componentsPath}/**/*.(schema|definitions|interface).json`;
    const globs = [customSchemaGlob];
    if (cmsPath) {
      globs.push(`${callingPath}/${cmsPath}/**/*.schema.json`);
    }
    const elements = await schemaToStackbit(
      globs,
      templates,
      globals,
      components
    );

    shell.mkdir('-p', `${shell.pwd()}/${configurationPath}/`);

    if (updateConfig) {
      const currentConfig: { components: ObjectModel[] } = await readJSON(
        `${callingPath}/${configurationPath}/models.json`
      );

      for (const element of [
        ...elements.components,
        ...elements.globals,
        ...elements.templates,
      ]) {
        const component = currentConfig.components.find(
          (component) => component.name === (element as ObjectModel).name
        );
      }
    }

    const configStringStackbit = await schemaToStackbitConfig(elements);

    await writeFile(
      `${shell.pwd()}/${configurationPath}/models.json`,
      configStringStackbit
    );

    shell.cp(
      `-r`,
      `${shell.pwd()}/${configurationPath}`,
      `${callingPath}/${dirname(configurationPath)}/`
    );

    logger.info(
      chalkTemplate`finished running the {bold stackbit} subtask successfully`
    );
    return true;
  };

  const stackbitRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold stackbit} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold stackbit} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [stackbit],
    revert: [stackbitRevert],
  };

  const typesVariable = 'stackbit-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command,
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} stackbit command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: stackbit command with types variable {bold ${typesVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(typesVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} stackbit command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: stackbit command with types variable {bold ${typesVariable}}`
    );
};

export default run;
