import winston from 'winston';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';

const moduleName = 'tokens';
const command = 'init';

// add const variables needed for task
// const demoVariable = 'demoValue';

const requiredCommands: string[] = ['jq'];

const {
  init: taskInit,
  start: taskStart,
  util: taskUtil
} = createTask(moduleName, command);

const { shell: taskUtilShell, getLogger } = taskUtil;

const {
  helper: {
    requireCommands: shellRequireCommands,
    fileExistsInCwd: shellFileExistsInCwd
  }
} = taskUtilShell;

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
    if (!shellFileExistsInCwd('token-primitives.json')) {
      logger.error(
        chalkTemplate`no {bold token-primitives.json} found in current directory`
      );
      shell.exit(1);
    }
    shell.popd();

    logger.info('prerequesites met, starting');
    return true;
  };

  const init = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold init} subtask`);

    // TODO implement subtask

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

  // destructure configuration to get to your values (see let declaration block above)
  // TODO re-add this, but with correct structure and typings
  // ({
  //   demo: {
  //     key: demoVariable,
  //   },
  // } = config);
  const initVariable = 'init-task';

  // define filename for configuration that will be written as a result of running this command.
  // the variable part should be some kind of identifier (e.g. 'rm-news' if that is the extension
  // being migrated).
  const configFileName = `.${moduleName}-${command}rc.json`;

  const cmdLogger = getLogger(moduleName, 'info', true, true, command).child({
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
