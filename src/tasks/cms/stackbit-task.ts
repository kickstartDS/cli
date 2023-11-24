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
  helper: { toStackbit: schemaToStackbit },
} = taskUtilSchema;

const run = async (
  componentsPath: string = 'src/components',
  configurationPath: string = 'src/cms',
  updateConfig: boolean = true,
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
    const stackbitComponents = await schemaToStackbit(customSchemaGlob);

    shell.mkdir('-p', `${shell.pwd()}/${configurationPath}/`);

    const configStringStackbit = JSON.stringify(
      { components: stackbitComponents },
      null,
      2
    );

    if (updateConfig) {
      const currentConfig: { components: ObjectModel[] } = await readJSON(
        `${callingPath}/${configurationPath}/components.123456.json`
      );

      for (const element of stackbitComponents) {
        const component = currentConfig.components.find(
          (component) => component.name === (element as ObjectModel).name
        );
        console.log('updateConfig', component?.name);
      }
    }

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
