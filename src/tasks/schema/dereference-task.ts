import winston from 'winston';
import { dirname, basename } from 'path';
import fg from 'fast-glob';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';
import fsExtra from 'fs-extra';

const writeFile = fsExtra.writeFile;

const moduleName = 'schema';
const command = 'dereference';
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
  helper: { dereferenceSchemas: schemaDereferenceSchemas },
} = taskUtilSchema;

const run = async (
  componentsPath: string = 'src/components',
  schemaDomain: string,
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

  const dereference = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold dereference} subtask`);

    const customSchemaGlob = `${callingPath}/${componentsPath}/**/*.schema.json`;
    const customSchemaPaths = await fg(customSchemaGlob);

    const dereffed = await schemaDereferenceSchemas(customSchemaGlob);

    logger.info(
      chalkTemplate`dereffed {bold ${
        Object.keys(dereffed).length
      } component definitions}`
    );

    await Promise.all(
      Object.keys(dereffed).map(async (schemaId) => {
        const schemaPath = customSchemaPaths.find((schemaPath) =>
          schemaPath.endsWith(`/${schemaId.split('/').pop()}` || 'NO MATCH')
        );
        if (!schemaPath)
          throw new Error("Couldn't find matching schema path for schema $id");
        const base = basename(schemaPath, '.json');
        const dir = dirname(schemaPath);

        return writeFile(`${dir}/${base}.dereffed.json`, dereffed[schemaId]);
      })
    );

    logger.info(
      chalkTemplate`finished running the {bold dereference} subtask successfully`
    );
    return true;
  };

  const dereferenceRevert = async (
    logger: winston.Logger
  ): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold dereference} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold dereference} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [dereference],
    revert: [dereferenceRevert],
  };

  const dereferenceVariable = 'dereference-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command,
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} dereference command with dereference variable {bold ${dereferenceVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: dereference command with dereference variable {bold ${dereferenceVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(dereferenceVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} dereference command with dereference variable {bold ${dereferenceVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: dereference command with dereference variable {bold ${dereferenceVariable}}`
    );
};

export default run;
