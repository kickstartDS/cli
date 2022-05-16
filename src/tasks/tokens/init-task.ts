import winston from 'winston';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';

const moduleName = 'tokens';
const command = 'init';

// add const variables needed for task
// const demoVariable = 'demoValue';

const requiredCommands: string[] = [];

const {
  init: taskInit,
  start: taskStart,
  util: taskUtil
} = createTask(moduleName, command);

const {
  // git: taskUtilGit,
  // template: taskUtilTemplate,
  // json: taskUtilJson,
  shell: taskUtilShell,
  getLogger
} = taskUtil;

// const {
//   helper: {
//     templateFiles,
//   },
// } = taskUtilTemplate;

// const {
//   helper: {
//     getValue: jsonGetValue,
//     copyValue: jsonCopyValue,
//     setValue: jsonSetValue,
//     deleteKey: jsonDeleteKey,
//     writeToFile: jsonWriteToFile,
//   },
// } = taskUtilJson;

// const {
//   backupSuffix,
//   helper: {
//     checkoutRepo: gitCheckoutRepo,
//     checkoutBranch: gitCheckoutBranch,
//     checkoutNewBranch: gitCheckoutNewBranch,
//     mergeBranch: gitMergeBranch,
//     addBitbucketRemote: gitAddBitbucketRemote,
//     removeRemote: gitRemoveRemote,
//     addCommitPushPath: gitAddCommitPushPath,
//     addCommitPushPaths: gitAddCommitPushPaths,
//     hasRemoteBranch: gitHasRemoteBranch,
//     fetchTags: gitFetchTags,
//     pushTags: gitPushTags,
//     pushBranch: gitPushBranch,
//     pushNewBranch: gitPushNewBranch,
//     mergeUnrelatedHistoriesBranch: gitMergeUnrelatedHistoriesBranch,
//   },
// } = taskUtilGit;

const {
  helper: {
    requireCommands: shellRequireCommands,
    fileExistsInCwd: shellFileExistsInCwd
    // dirExistsInCwd: shellDirExistsInCwd,
    // backupDirInCwd: shellBackupDirInCwd,
    // restoreDirInCwd: shellRestoreDirInCwd,
    // hasBackedUpDirInCwd: shellHasBackedUpDirInCwd,
  }
} = taskUtilShell;

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

  const check = async (logger: winston.Logger): Promise<boolean> => {
    logger.info('checking prerequesites before starting');

    shellRequireCommands(requiredCommands);
    shellFileExistsInCwd('token-primitives.json');

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

  config = await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);

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
