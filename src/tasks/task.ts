/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import shell from 'shelljs';
import merge from 'ts-deepmerge';
import chalkTemplate from 'chalk-template';
import { cosmiconfig } from 'cosmiconfig';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import analyticsHelper from '../util/analytics.js';
import dockerHelper from '../util/docker.js';
import exampleHelper from '../util/example.js';
import fileHelper from '../util/file.js';
import gitHelper from '../util/git.js';
import jsonHelper from '../util/json.js';
import npmHelper from '../util/npm.js';
import onepasswordHelper from '../util/onepassword.js';
import promiseHelper from '../util/promise.js';
import schemaHelper from '../util/schema.js';
import shellHelper from '../util/shell.js';
import templateHelper from '../util/template.js';
import tokensHelper from '../util/tokens.js';

import prompt from '../prompting.js';
import {
  getLogger,
  addProgressBarTransport,
  removeProgressBarTransport
} from '../logging.js';
import { StepFunction, TaskUtil } from '../../types/index.js';

const { rm, mkdir, pushd, popd, tempdir } = shell;

export default (moduleName: string, commandName: string): TaskUtil => {
  const module = moduleName;
  const command = commandName;

  let config: Record<string, unknown>;
  let tmpDir: string;

  const explorer = cosmiconfig(`${module}-${command}`);
  const logger = getLogger(module, 'info', true, false, command).child({
    command
  });
  const getTmpDir = () => tmpDir || '';
  const getCliDir = () => dirname(dirname(fileURLToPath(import.meta.url)));

  // TODO check if shell does, indeed, need to be injected here (as
  // it was before). Seems like the `shell.pwd()` gets re-initialized
  // to process.cwd() on import in a new file (like tokens.ts >
  // generateTokens)
  const analyticsUtil = analyticsHelper(logger);
  const dockerUtil = dockerHelper(logger);
  const exampleUtil = exampleHelper(logger);
  const fileUtil = fileHelper(logger);
  const gitUtil = gitHelper(logger);
  const jsonUtil = jsonHelper(logger);
  const npmUtil = npmHelper(logger, jsonUtil);
  const onepasswordUtil = onepasswordHelper(logger);
  const promiseUtil = promiseHelper(logger);
  const shellUtil = shellHelper(logger);
  const schemaUtil = schemaHelper(logger);
  const templateUtil = templateHelper(logger);
  const tokensUtil = tokensHelper(logger);

  const {
    analyticsActive,
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

      if (tmpDir && tmpDir && tmpDir.length > 5 && tmpDir.startsWith('/tmp')) {
        rm('-rf', [`${tmpDir}/*`, `${tmpDir}/.*`]);
      }
      mkdir('-p', tmpDir);

      cmdLogger.info(
        chalkTemplate`finished cleaning up temp dir {bold ${tmpDir}} before starting command`
      );
    };

    const revert = async () => {
      let progressBarTransport;

      if (analyticsActive) {
        analyticsInit(moduleName, `${commandName}-revert`, identifier);
        const averageTiming = await analyticsGetAverageTiming();
        progressBarTransport = addProgressBarTransport(
          moduleName,
          averageTiming
        );
      }

      for (const [index, revertSubCommand] of asyncReverts.entries()) {
        const revertSubCommandName = revertSubCommand.name
          .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
          .toLowerCase();

        if (analyticsActive) analyticsTimeStart(revertSubCommandName, 'revert');
        await revertSubCommand(
          logger.child({
            subcommand: revertSubCommandName,
            step: index + 1,
            numSteps: asyncReverts.length
          }),
          tmpDir
        );
        if (analyticsActive) {
          analyticsTimeEnd(revertSubCommandName, 'revert');
          if (progressBarTransport)
            progressBarTransport.completeStep(revertSubCommandName);
        }
      }

      if (progressBarTransport) removeProgressBarTransport(moduleName);
      if (analyticsActive) return analyticsClose();

      return Promise.resolve();
    };

    const run = async () => {
      let progressBarTransport;

      if (analyticsActive) {
        analyticsInit(moduleName, commandName, identifier);
        const averageTiming = await analyticsGetAverageTiming();
        progressBarTransport = addProgressBarTransport(
          moduleName,
          averageTiming
        );
      }

      for (const [index, check] of asyncChecks.entries()) {
        const checkName = check.name
          .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
          .toLowerCase();

        if (analyticsActive) analyticsTimeStart(checkName, 'check');
        await check(
          logger.child({
            subcommand: checkName,
            step: index + 1,
            numSteps: asyncChecks.length
          }),
          tmpDir
        );
        if (analyticsActive) {
          analyticsTimeEnd(checkName, 'check');
          if (progressBarTransport)
            progressBarTransport.completeStep(checkName);
        }
      }

      if (cleanup) await cleanUp();

      for (const [index, subCommand] of asyncSubCommands.entries()) {
        const subCommandName = subCommand.name
          .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
          .toLowerCase();

        if (analyticsActive) analyticsTimeStart(subCommandName, 'run');
        await subCommand(
          logger.child({
            subcommand: subCommandName,
            step: index + 1,
            numSteps: asyncSubCommands.length
          }),
          tmpDir
        );
        if (analyticsActive) {
          analyticsTimeEnd(subCommandName, 'run');

          if (progressBarTransport)
            progressBarTransport.completeStep(subCommandName);
        }
      }

      if (progressBarTransport) removeProgressBarTransport(moduleName);
      if (analyticsActive) return analyticsClose();

      return Promise.resolve();
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
    getCliDir,
    util: {
      sh: shell,
      getLogger,
      analytics: analyticsUtil,
      docker: dockerUtil,
      example: exampleUtil,
      file: fileUtil,
      git: gitUtil,
      json: jsonUtil,
      npm: npmUtil,
      onepassword: onepasswordUtil,
      promise: promiseUtil,
      schema: schemaUtil,
      shell: shellUtil,
      template: templateUtil,
      tokens: tokensUtil
    }
  };
};
