import winston from 'winston';
import fsExtra from 'fs-extra';
import { dirname } from 'path';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';

const writeFile = fsExtra.writeFile;

const moduleName = 'cms';
const command = 'uniform';
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
  helper: { toUniform: schemaToUniform },
} = taskUtilSchema;

const run = async (
  schemaPaths: string[] = ['src/components'],
  layerOrder: string[] = ['cms', 'schema'],
  configurationPath: string = 'src/cms',
  templates: string[] = ['page', 'blog-post', 'blog-overview', 'settings'],
  globals: string[] = ['header', 'footer', 'seo'],
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

  const uniform = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold uniform} subtask`);

    const globs = [];
    for (const schemaPath of schemaPaths) {
      globs.push(
        `${callingPath}/${schemaPath}/**/*.(schema|definitions|interface).json`
      );
    }

    const {
      components: uniformComponents,
      templates: uniformTemplates,
      globals: uniformGlobals,
    } = await schemaToUniform(globs, templates, globals, [
      ...layerOrder,
      'kickstartds',
    ]);

    shell.mkdir('-p', `${shell.pwd()}/${configurationPath}/`);

    const configStringUniform = JSON.stringify(
      {
        components: [
          ...uniformComponents,
          ...uniformTemplates,
          ...uniformGlobals,
        ],
      },
      null,
      2
    );
    await writeFile(
      `${shell.pwd()}/${configurationPath}/components.json`,
      configStringUniform
    );

    shell.cp(
      `-r`,
      `${shell.pwd()}/${configurationPath}`,
      `${callingPath}/${dirname(configurationPath)}/`
    );

    logger.info(
      chalkTemplate`finished running the {bold uniform} subtask successfully`
    );
    return true;
  };

  const uniformRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold uniform} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold uniform} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [uniform],
    revert: [uniformRevert],
  };

  const typesVariable = 'uniform-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command,
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} uniform command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: uniform command with types variable {bold ${typesVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(typesVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} uniform command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: uniform command with types variable {bold ${typesVariable}}`
    );
};

export default run;
