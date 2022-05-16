/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import shell from 'shelljs';
import merge from 'ts-deepmerge';
import chalkTemplate from 'chalk-template';
import { cosmiconfig } from 'cosmiconfig';

import analyticsHelper from '../util/analytics.js';
import dockerHelper from '../util/docker.js';
import fileHelper from '../util/file.js';
import gitHelper from '../util/git.js';
import jsonHelper from '../util/json.js';
import npmHelper from '../util/npm.js';
import onepasswordHelper from '../util/onepassword.js';
import promiseHelper from '../util/promise.js';
import shellHelper from '../util/shell.js';
import templateHelper from '../util/template.js';

import prompt from '../prompting.js';
import {
  getLogger,
  addProgressBarTransport,
  removeProgressBarTransport
} from '../logging.js';

const { rm, mkdir, pushd, popd, tempdir } = shell;

export default (moduleName: string, commandName: string): TaskUtil => {
  const module = moduleName;
  const command = commandName;

  let config: Record<string, unknown>;
  let tmpDir: string;

  const explorer = cosmiconfig(`${module}-${command}`);
  const logger = getLogger(module, 'info', true, true, command).child({
    command
  });
  const getTmpDir = () => tmpDir || '';

  const analyticsUtil = analyticsHelper(logger);
  const dockerUtil = dockerHelper(logger);
  const fileUtil = fileHelper(logger);
  const gitUtil = gitHelper(logger);
  const jsonUtil = jsonHelper(logger);
  const npmUtil = npmHelper(logger, jsonUtil);
  const onepasswordUtil = onepasswordHelper(logger);
  const promiseUtil = promiseHelper(logger);
  const shellUtil = shellHelper(logger);
  const templateUtil = templateHelper(logger);

  const {
    helper: {
      timeStart: analyticsTimeStart,
      timeEnd: analyticsTimeEnd,
      init: analyticsInit,
      close: analyticsClose,
      getAverageTiming: analyticsGetAverageTiming
    }
  } = analyticsUtil;

  let skipPrompts = false;
  let reverting = false;
  let silentState: boolean;
  let silent = true;
  let cleanup = true;

  const init = async (
    initConfig?: Record<string, unknown> | null,
    rcOnly = false,
    isRevert = false,
    shouldCleanup = true,
    debugActive = false
  ): Promise<Record<string, unknown>> => {
    const rcConfig = await explorer.search();

    skipPrompts = rcOnly;
    reverting = isRevert;
    silent = !debugActive;
    cleanup = shouldCleanup;

    if (initConfig) {
      config = initConfig;
    } else if (skipPrompts || reverting) {
      if (rcConfig) {
        config = rcConfig.config;
      } else {
        // TODO add error handling
      }
    } else {
      logger.info(
        chalkTemplate`starting: prompt for {bold ${module}-${command}} configuration`,
        { subcommand: 'prompt' }
      );

      const promptedConfig = await prompt(module, command);

      config =
        rcConfig && rcConfig.config
          ? merge.default(rcConfig.config, promptedConfig)
          : promptedConfig;
    }

    return config;
  };

  const start = async (
    identifier: string,
    asyncChecks: StepFunction[] = [],
    asyncSubCommands: StepFunction[] = [],
    asyncReverts: StepFunction[] = []
  ) => {
    const cleanUp = () => {
      const cmdLogger = logger.child({ subcommand: 'cleanup' });

      cmdLogger.info(
        chalkTemplate`cleaning up temp dir {bold ${tmpDir}} before starting command`
      );

      rm('-rf', [`${tmpDir}/*`, `${tmpDir}/.*`]);
      mkdir('-p', tmpDir);

      cmdLogger.info(
        chalkTemplate`finished cleaning up temp dir {bold ${tmpDir}} before starting command`
      );
    };

    const revert = async () => {
      analyticsInit(moduleName, `${commandName}-revert`, identifier);
      const averageTiming = await analyticsGetAverageTiming();
      const progressBarTransport = addProgressBarTransport(
        moduleName,
        averageTiming
      );

      for (const [index, revertSubCommand] of asyncReverts.entries()) {
        const revertSubCommandName = revertSubCommand.name
          .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
          .toLowerCase();

        analyticsTimeStart(revertSubCommandName, 'revert');
        await revertSubCommand(
          logger.child({
            subcommand: revertSubCommandName,
            step: index + 1,
            numSteps: asyncReverts.length
          }),
          tmpDir
        );
        analyticsTimeEnd(revertSubCommandName, 'revert');

        if (progressBarTransport)
          progressBarTransport.completeStep(revertSubCommandName);
      }

      if (progressBarTransport) removeProgressBarTransport(moduleName);
      return analyticsClose();
    };

    const run = async () => {
      analyticsInit(moduleName, commandName, identifier);
      const averageTiming = await analyticsGetAverageTiming();
      const progressBarTransport = addProgressBarTransport(
        moduleName,
        averageTiming
      );

      for (const [index, check] of asyncChecks.entries()) {
        const checkName = check.name
          .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
          .toLowerCase();

        analyticsTimeStart(checkName, 'check');
        await check(
          logger.child({
            subcommand: checkName,
            step: index + 1,
            numSteps: asyncChecks.length
          }),
          tmpDir
        );
        analyticsTimeEnd(checkName, 'check');

        if (progressBarTransport) progressBarTransport.completeStep(checkName);
      }

      if (cleanup) await cleanUp();

      for (const [index, subCommand] of asyncSubCommands.entries()) {
        const subCommandName = subCommand.name
          .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
          .toLowerCase();

        analyticsTimeStart(subCommandName, 'run');
        await subCommand(
          logger.child({
            subcommand: subCommandName,
            step: index + 1,
            numSteps: asyncSubCommands.length
          }),
          tmpDir
        );
        analyticsTimeEnd(subCommandName, 'run');

        if (progressBarTransport)
          progressBarTransport.completeStep(subCommandName);
      }

      if (progressBarTransport) removeProgressBarTransport(moduleName);
      return analyticsClose();
    };

    if (silent) {
      silentState = shell.config.silent;
      shell.config.silent = true;
    }

    tmpDir = `${tempdir()}/${module}-${command}-${identifier}`;
    mkdir('-p', tmpDir);

    pushd(tmpDir);

    let result;
    if (reverting) result = await revert();
    else result = await run();

    popd();

    if (silent) {
      shell.config.silent = silentState;
    }

    return result;
  };

  return {
    init,
    start,
    getTmpDir,
    util: {
      sh: shell,
      getLogger,
      analytics: analyticsUtil,
      docker: dockerUtil,
      file: fileUtil,
      git: gitUtil,
      json: jsonUtil,
      npm: npmUtil,
      onepassword: onepasswordUtil,
      promise: promiseUtil,
      shell: shellUtil,
      template: templateUtil
    }
  };
};
