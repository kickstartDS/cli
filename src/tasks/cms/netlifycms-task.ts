import winston from 'winston';
import fsExtra from 'fs-extra';
import { dirname } from 'path';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';
import {
  INetlifyCmsConfig,
  createConfig,
} from '@kickstartds/jsonschema2netlifycms';
import { dump as yamlDump } from 'js-yaml';

const writeFile = fsExtra.writeFile;
const readJSON = fsExtra.readJSON;

const moduleName = 'cms';
const command = 'netlifycms';
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
  helper: { toNetlifycms: schemaToNetlifycms },
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

  const netlifycms = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold netlifycms} subtask`);

    const customSchemaGlob = `${callingPath}/${componentsPath}/**/*.(schema|definitions|interface).json`;
    const netlifycmsComponents = await schemaToNetlifycms(customSchemaGlob);
    const netlifyConfig = createConfig(
      netlifycmsComponents || [],
      [],
      undefined,
      'pages',
      'settings'
    );

    shell.mkdir('-p', `${shell.pwd()}/${configurationPath}/`);

    const configStringNetlifycms = yamlDump(netlifyConfig);

    await writeFile(
      `${shell.pwd()}/${configurationPath}/config.yml`,
      configStringNetlifycms
    );

    shell.cp(
      `-r`,
      `${shell.pwd()}/${configurationPath}`,
      `${callingPath}/${dirname(configurationPath)}/`
    );

    logger.info(
      chalkTemplate`finished running the {bold netlifycms} subtask successfully`
    );
    return true;
  };

  const netlifycmsRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold netlifycms} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold netlifycms} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [netlifycms],
    revert: [netlifycmsRevert],
  };

  const typesVariable = 'netlifycms-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command,
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} netlifycms command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: netlifycms command with types variable {bold ${typesVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(typesVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} netlifycms command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: netlifycms command with types variable {bold ${typesVariable}}`
    );
};

export default run;
