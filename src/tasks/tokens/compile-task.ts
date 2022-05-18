import winston from 'winston';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';

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
    dirExistsInCwd: shellDirExistsInCwd
  }
} = taskUtilShell;

const {
  helper: {
    getStyleDictionary: tokensGetStyleDictionary,
    compileTokens: tokensCompileTokens
  }
} = taskUtilTokens;

const run = async (
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
    if (!shellDirExistsInCwd('tokens')) {
      logger.error(
        chalkTemplate`no {bold tokens} directory found in current directory`
      );
      shell.exit(1);
    }
    shell.popd();

    logger.info('prerequesites met, starting');
    return true;
  };

  const compile = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold compile} subtask`);

    shell.cp('-r', `${callingPath}/tokens`, shell.pwd());

    logger.info(
      chalkTemplate`getting {bold Style Dictionary} from token files`
    );
    const styleDictionary = tokensGetStyleDictionary(callingPath, 'tokens');

    logger.info(
      chalkTemplate`compiling {bold Style Dictionary} to needed CSS and assets`
    );
    await tokensCompileTokens(styleDictionary);

    logger.info(
      chalkTemplate`copying generated CSS and assets to local folder`
    );
    shell.cp('-r', ['.storybook', 'tokens.css'], callingPath);

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

  const cmdLogger = getLogger(moduleName, 'info', true, true, command).child({
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
