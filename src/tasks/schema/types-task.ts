import winston from 'winston';
import fg from 'fast-glob';
import fsExtra from 'fs-extra';
import { basename, dirname } from 'path';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';
import { pascalCase } from 'change-case';

const writeFile = fsExtra.writeFile;

const moduleName = 'schema';
const command = 'types';
const requiredCommands: string[] = [];

const {
  init: taskInit,
  start: taskStart,
  util: taskUtil
} = createTask(moduleName, command);

const { shell: taskUtilShell, schema: taskUtilSchema, getLogger } = taskUtil;

const {
  helper: {
    requireCommands: shellRequireCommands,
  }
} = taskUtilShell;

const {
  helper: {
    generateComponentPropTypes: schemaGenerateComponentPropTypes,
    dereferenceSchemas: schemaDereferenceSchemas,
  }
} = taskUtilSchema;

const run = async (
  componentsPath: string = 'src/components',
  schemaDomain: string,
  rcOnly: boolean,
  isRevert: boolean,
  shouldCleanup: boolean,
  debugActive: boolean,
): Promise<void> => {
  const callingPath: string = process.cwd();

  const check = async (logger: winston.Logger): Promise<boolean> => {
    logger.info('checking prerequesites before starting');

    shellRequireCommands(requiredCommands);

    logger.info('prerequesites met, starting');
    return true;
  };

  const types = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold types} subtask`);

    const schemaPaths = await fg(`${callingPath}/${componentsPath}/**/*.schema.json`);
    const dereffed = await schemaDereferenceSchemas(schemaPaths, callingPath, componentsPath, schemaDomain);

    logger.info(chalkTemplate`dereffed {bold ${dereffed.length} component definitions}`);

    const types = await schemaGenerateComponentPropTypes(dereffed);

    await Promise.all(Object.keys(types).map(async (schemaPath) => {
      const schema = dereffed[schemaPath];
      const base = basename(schemaPath, ".json");
      const dir = dirname(schemaPath);
      schema.title += " Props";

      return writeFile(
        `${dir}/${pascalCase(
          base.replace(/\.(schema|definitions)$/, "")
        )}Props.ts`,
        types[schemaPath]
      );
    }));

    logger.info(
      chalkTemplate`finished running the {bold types} subtask successfully`
    );
    return true;
  };

  const typesRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold types} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold types} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [types],
    revert: [typesRevert]
  };

  const typesVariable = 'types-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} types command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: types command with types variable {bold ${typesVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(typesVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} types command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: types command with types variable {bold ${typesVariable}}`
    );
};

export default run;
