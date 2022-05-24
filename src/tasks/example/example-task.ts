import winston from 'winston';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';

const moduleName = 'example'; // name of module; example: 'system', 'tokens', 'components'
const command = 'demo'; // name of command; example: 'create', 'convert', 'build'

// add const variables needed for task
// const demoVariable = 'demoValue';

// add required commands (those are executables on the local shell $PATH)
// example: `const requiredCommands = ['git', 'jq']`
const requiredCommands: string[] = [];

// require task.js, which is our own cli task runner, import methods and utilities
const {
  init: taskInit,
  start: taskStart,
  util: taskUtil
} = createTask(moduleName, command);

// get all needed utility helpers
const { json: taskUtilJson, shell: taskUtilShell, getLogger } = taskUtil;

// get JSON helpers
const {
  helper: { prettyPrintJson: jsonPrettyPrintJson }
} = taskUtilJson;

// get shell helpers
const {
  helper: { requireCommands: shellRequireCommands }
} = taskUtilShell;

// entrypoint for task, this will be called from your command
const run = async (
  rcOnly: boolean,
  isRevert: boolean,
  shouldCleanup: boolean,
  debugActive: boolean
): Promise<void> => {
  let config = {};

  // add your own local variables, needed for the execution of your subcommands.
  // includes variables that you need from reading the prompt, or importing rc
  // configuration:

  // check to require all defined required commands (requiredCommands)
  const check = async (logger: winston.Logger): Promise<boolean> => {
    logger.info('checking prerequesites before starting');

    shellRequireCommands(requiredCommands);

    logger.info('prerequesites met, starting');
    return true;
  };

  // demo subtask
  const demo = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold demo} subtask`);

    // TODO implement subtask

    logger.info(
      chalkTemplate`finished running the {bold demo} subtask successfully`
    );
    return true;
  };

  // revert demo subtask
  const demoRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold demo} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold demo} subtask finished successfully`
    );
    return true;
  };

  // add all checks that should run here
  const checks: StepFunction[] = [check];

  // add all tasks and reverts that should run here
  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [demo],
    revert: [demoRevert]
  };

  // get configuration by initializing task
  config = await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);

  // destructure configuration to get to your values (see let declaration block above)
  // TODO re-add this, but with correct structure and typings
  // ({
  //   demo: {
  //     key: demoVariable,
  //   },
  // } = config);
  const demoVariable = 'example-task';

  // define filename for configuration that will be written as a result of running this command.
  // the variable part should be some kind of identifier (e.g. 'rm-news' if that is the extension
  // being migrated).
  const configFileName = `.${moduleName}-${command}rc.json`;

  // add logging around your sub-commands 1/2
  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command
  });

  // log values to console in demo task
  cmdLogger.info(
    chalkTemplate`input for this task ({bold ${configFileName}}):\n${jsonPrettyPrintJson(
      config
    )}`.trim()
  );

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting] demo command with demo variable {bold ${demoVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: demo command with demo variable {bold ${demoVariable}}`
    );

  // start the task
  await taskStart(demoVariable, checks, tasks.run, tasks.revert);

  // add logging around your sub-commands 2/2
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting] demo command with demo variable {bold ${demoVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: demo command with demo variable {bold ${demoVariable}}`
    );
};

export default run;
