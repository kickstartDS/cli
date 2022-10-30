import winston from 'winston';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import StyleDictionary from 'style-dictionary';
import { dirname } from 'path';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';

const moduleName = 'tokens';
const command = 'compile';
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
    dirExistsInCwd: shellDirExistsInCwd,
    fileExistsInCwd: shellFileExistsInCwd
  }
} = taskUtilShell;

const {
  helper: {
    getDefaultStyleDictionary: tokensGetDefaultStyleDictionary,
    getStyleDictionary: tokensGetStyleDictionary,
    compileTokens: tokensCompileTokens
  }
} = taskUtilTokens;

const run = async (
  tokenPath: string = 'tokens',
  rcOnly: boolean,
  isRevert: boolean,
  shouldCleanup: boolean,
  debugActive: boolean
): Promise<void> => {
  const callingPath: string = process.cwd();

  const check = async (logger: winston.Logger): Promise<boolean> => {
    logger.info('checking prerequesites before starting');

    shellRequireCommands(requiredCommands);

    shell.pushd(`${callingPath}`);
    if (!shellDirExistsInCwd(tokenPath)) {
      logger.error(
        chalkTemplate`no {bold ${tokenPath}} directory found in current directory`
      );
      shell.exit(1);
    }
    shell.popd();

    logger.info('prerequesites met, starting');
    return true;
  };

  const compile = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold compile} subtask`);

    shell.mkdir('-p', `${shell.pwd()}/${dirname(tokenPath)}/`);
    shell.cp('-r', `${callingPath}/${tokenPath}`, `${shell.pwd()}/${dirname(tokenPath)}/`);

    logger.info(
      chalkTemplate`getting {bold Style Dictionary} from token files`
    );

    let styleDictionary: StyleDictionary.Core;
    if (shellFileExistsInCwd(`${callingPath}/sd.config.cjs`)) {
      styleDictionary = await tokensGetStyleDictionary(
        callingPath,
        tokenPath,
        `${callingPath}/sd.config.cjs`
      );
    } else {
      styleDictionary = tokensGetDefaultStyleDictionary(callingPath, tokenPath);
    }

    logger.info(
      chalkTemplate`compiling {bold Style Dictionary} to needed CSS and assets`
    );
    await tokensCompileTokens(
      styleDictionary,
      Object.keys(styleDictionary.options.platforms).filter((platform) => styleDictionary.options.platforms[platform].buildPath)
    );

    logger.info(
      chalkTemplate`copying generated CSS and assets to local folder`
    );

    Object.keys(styleDictionary.options.platforms).forEach((platformName) => {
      const platform = styleDictionary.options.platforms[platformName];
      const { files } = platform;

      if (files && files.length) {
        files.forEach((file) => {
          shell.mkdir(
            '-p',
            `${callingPath.endsWith('/') ? callingPath : `${callingPath}/`}${
              platform.buildPath || ''
            }`
          );
          shell.cp(
            `${shell.pwd()}/${platform.buildPath || ''}${file.destination}`,
            `${callingPath.endsWith('/') ? callingPath : `${callingPath}/`}${
              platform.buildPath || ''
            }/${file.destination}`
          );
        });
      }
    });

    logger.info(
      chalkTemplate`finished running the {bold compile} subtask successfully`
    );
    return true;
  };

  const compileRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold compile} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold compile} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [compile],
    revert: [compileRevert]
  };

  const compileVariable = 'compile-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} compile command with compile variable {bold ${compileVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: compile command with compile variable {bold ${compileVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(compileVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} compile command with compile variable {bold ${compileVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: compile command with compile variable {bold ${compileVariable}}`
    );
};

export default run;
