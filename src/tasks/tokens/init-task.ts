import winston from 'winston';
import shell from 'shelljs';
import { dirname, basename } from 'path';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';

const moduleName = 'tokens';
const command = 'init';
const requiredCommands: string[] = [];

const {
  init: taskInit,
  start: taskStart,
  util: taskUtil
} = createTask(moduleName, command);

const { shell: taskUtilShell, tokens: taskUtilTokens, getLogger } = taskUtil;

const {
  helper: {
    requireCommands: shellRequireCommands,
    fileExistsInCwd: shellFileExistsInCwd
  }
} = taskUtilShell;

const {
  helper: {
    generateFromPrimitivesPath: tokensGenerateFromPrimitivesPath,
  }
} = taskUtilTokens;

const run = async (
  brandingTokenPath: string = 'src/token/branding-token.json',
  tokenDictionaryPath: string = 'src/token/dictionary',
  rcOnly: boolean,
  isRevert: boolean,
  shouldCleanup: boolean,
  debugActive: boolean,
): Promise<void> => {
  const callingPath: string = process.cwd();

  const check = async (logger: winston.Logger): Promise<boolean> => {
    logger.info('checking prerequesites before starting');

    shellRequireCommands(requiredCommands);

    shell.pushd(`${callingPath}/${dirname(brandingTokenPath)}`);
    if (!shellFileExistsInCwd(basename(brandingTokenPath))) {
      logger.error(
        chalkTemplate`no {bold ${basename(brandingTokenPath)}} found in directory {bold ${dirname(brandingTokenPath)}}`
      );
      shell.exit(1);
    }
    shell.popd();

    logger.info('prerequesites met, starting');
    return true;
  };

  const init = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold init} subtask`);

    shell.cp(`${callingPath}/${brandingTokenPath}`, shell.pwd());
    await tokensGenerateFromPrimitivesPath(
      `${shell.pwd()}/${basename(brandingTokenPath)}`,
      `${shell.pwd()}/${tokenDictionaryPath}`
    );
    shell.cp(`-r`, `${shell.pwd()}/${tokenDictionaryPath}`, `${callingPath}/${dirname(tokenDictionaryPath)}/`);

    logger.info(
      chalkTemplate`finished running the {bold init} subtask successfully`
    );
    return true;
  };

  const initRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold init} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold init} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [init],
    revert: [initRevert]
  };

  const initVariable = 'init-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} init command with init variable {bold ${initVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: init command with init variable {bold ${initVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(initVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} init command with init variable {bold ${initVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: init command with init variable {bold ${initVariable}}`
    );
};

export default run;
