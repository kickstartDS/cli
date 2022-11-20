import winston from 'winston';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import { dirname } from 'path';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';
import StyleDictionary from 'style-dictionary';

const moduleName = 'tokens';
const command = 'tofigma';
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
    syncToFigma: tokensSyncToFigma
  }
} = taskUtilTokens;

const run = async (
  tokenDictionaryPath: string = 'src/token/dictionary',
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
    if (!shellDirExistsInCwd(tokenDictionaryPath)) {
      logger.error(
        chalkTemplate`no {bold ${tokenDictionaryPath}} directory found in current directory`
      );
      shell.exit(1);
    }

    shell.popd();

    logger.info('prerequesites met, starting');
    return true;
  };

  const tofigma = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold tofigma} subtask`);

    shell.mkdir('-p', `${shell.pwd()}/${dirname(tokenDictionaryPath)}/`);
    shell.cp('-r', `${callingPath}/${tokenDictionaryPath}`, `${shell.pwd()}/${dirname(tokenDictionaryPath)}/`);

    logger.info(
      chalkTemplate`getting {bold Style Dictionary} from token files`
    );

    let styleDictionary: StyleDictionary.Core;
    if (shellFileExistsInCwd(`${callingPath}/sd.config.cjs`)) {
      styleDictionary = await tokensGetStyleDictionary(
        callingPath,
        tokenDictionaryPath,
        `${callingPath}/sd.config.cjs`
      );
    } else {
      styleDictionary = tokensGetDefaultStyleDictionary(callingPath, tokenDictionaryPath);
    }

    tokensSyncToFigma(`${callingPath}/assets/tokens/figma`, styleDictionary);

    logger.info(
      chalkTemplate`finished running the {bold tofigma} subtask successfully`
    );
    return true;
  };

  const tofigmaRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold tofigma} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold tofigma} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [tofigma],
    revert: [tofigmaRevert]
  };

  const tofigmaVariable = 'tofigma-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} tofigma command with tofigma variable {bold ${tofigmaVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: tofigma command with tofigma variable {bold ${tofigmaVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(tofigmaVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} tofigma command with tofigma variable {bold ${tofigmaVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: tofigma command with tofigma variable {bold ${tofigmaVariable}}`
    );
};

export default run;
