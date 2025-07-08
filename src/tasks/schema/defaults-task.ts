import winston from 'winston';
import { dirname, basename } from 'path';
import fg from 'fast-glob';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';
import fsExtra from 'fs-extra';
import { pascalCase } from 'change-case';

const writeFile = fsExtra.writeFile;

const moduleName = 'schema';
const command = 'defaults';
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
  helper: { createDefaultObjects: schemaCreateDefaultObjects },
} = taskUtilSchema;

const run = async (
  schemaPaths: string[] = ['src/components'],
  layerOrder: string[] = ['cms', 'schema'],
  defaultPageSchema: boolean = true,
  layerKickstartdsComponents: boolean = true,
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

  const defaults = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold defaults} subtask`);

    const globs = [];
    for (const schemaPath of schemaPaths) {
      globs.push(
        `${callingPath}/${schemaPath}/**/*.(schema|definitions|interface).json`
      );
    }

    const customSchemaPaths = await fg(globs);
    const defaults = await schemaCreateDefaultObjects(
      globs,
      defaultPageSchema,
      layerKickstartdsComponents,
      [...layerOrder, 'kickstartds']
    );

    logger.info(
      chalkTemplate`created {bold ${
        Object.keys(defaults).length
      } schema default objects}`
    );

    await Promise.all(
      Object.keys(defaults).map(async (schemaId) => {
        const schemaPath = customSchemaPaths.find(
          (schemaPath) =>
            schemaPath.endsWith(
              `/${schemaId.split('/').pop()}` || 'NO MATCH'
            ) &&
            (schemaId.startsWith('http://cms.')
              ? !schemaPath.includes('node_modules')
              : true)
        );
        if (!schemaPath)
          throw new Error("Couldn't find matching schema path for schema $id");
        const base = basename(schemaPath, '.json');
        const dir = dirname(schemaPath);

        return writeFile(
          `${dir}/${pascalCase(
            base.replace(/\.(schema|definitions)$/, '')
          )}Defaults.ts`,
          defaults[schemaId]
        );
      })
    );

    logger.info(
      chalkTemplate`finished running the {bold defaults} subtask successfully`
    );
    return true;
  };

  const defaultsRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold defaults} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold defaults} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [defaults],
    revert: [defaultsRevert],
  };

  const defaultsVariable = 'defaults-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command,
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} defaults command with defaults variable {bold ${defaultsVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: defaults command with defaults variable {bold ${defaultsVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(defaultsVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} defaults command with defaults variable {bold ${defaultsVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: defaults command with defaults variable {bold ${defaultsVariable}}`
    );
};

export default run;
