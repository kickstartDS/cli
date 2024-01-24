import winston from 'winston';
import fsExtra from 'fs-extra';
import { dirname } from 'path';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import { pascalCase } from 'change-case';
import { getSchemaName } from '@kickstartds/jsonschema-utils';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';

const writeFile = fsExtra.writeFile;

const moduleName = 'schema';
const command = 'presets';
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
  helper: { extractPresets: schemaExtractPresets },
} = taskUtilSchema;

const run = async (
  componentsPath: string = 'src/components',
  presetsPath: string = 'src/presets',
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

  const presets = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold presets} subtask`);

    const customSchemaGlob = `${callingPath}/${componentsPath}/**/*.stories.(tsx|jsx)`;
    const componentPresets = await schemaExtractPresets(customSchemaGlob);

    // shell.mkdir('-p', `${shell.pwd()}/${presetsPath}/`);

    await Promise.all(
      Object.keys(componentPresets).map(async (preset) => {
        console.log('preset', preset);
        return true;

        // return writeFile(
        //   `${shell.pwd()}/${typesPath}/${pascalCase(
        //     getSchemaName(schemaId)
        //   )}Props.d.ts`,
        //   layeredTypes[schemaId]
        // );
      })
    );

    // shell.cp(
    //   `-r`,
    //   `${shell.pwd()}/${typesPath}`,
    //   `${callingPath}/${dirname(typesPath)}/`
    // );

    logger.info(
      chalkTemplate`finished running the {bold presets} subtask successfully`
    );
    return true;
  };

  const presetsRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold presets} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold presets} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [presets],
    revert: [presetsRevert],
  };

  const presetsVariable = 'presets-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command,
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} presets command with types variable {bold ${presetsVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: presets command with types variable {bold ${presetsVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(presetsVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} presets command with types variable {bold ${presetsVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: presets command with types variable {bold ${presetsVariable}}`
    );
};

export default run;
