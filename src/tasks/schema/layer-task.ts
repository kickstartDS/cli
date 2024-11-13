import winston from 'winston';
import fsExtra from 'fs-extra';
import { dirname } from 'path';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import { pascalCase } from 'change-case';
import { getSchemaName } from '@kickstartds/jsonschema-utils';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';

const writeFile = fsExtra.writeFile;

const moduleName = 'schema';
const command = 'layer';
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
  helper: { layerComponentPropTypes: schemaLayerComponentPropTypes },
} = taskUtilSchema;

const run = async (
  componentsPath: string = 'src/components',
  cmsPath: string,
  typesPath: string = 'src/types',
  mergeSchemas: boolean,
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

  const layer = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold layer} subtask`);

    const customSchemaGlob = `${callingPath}/${componentsPath}/**/*.(schema|definitions).json`;
    const globs = [customSchemaGlob];
    if (cmsPath) {
      globs.push(`${callingPath}/${cmsPath}/**/*.schema.json`);
    }

    const layeredTypes = await schemaLayerComponentPropTypes(
      globs,
      mergeSchemas,
      defaultPageSchema,
      layerKickstartdsComponents
    );

    shell.mkdir('-p', `${shell.pwd()}/${typesPath}/`);

    await Promise.all(
      Object.keys(layeredTypes).map(async (schemaId) => {
        return writeFile(
          `${shell.pwd()}/${typesPath}/${pascalCase(
            getSchemaName(schemaId)
          )}Props.d.ts`,
          layeredTypes[schemaId]
        );
      })
    );

    shell.cp(
      `-r`,
      `${shell.pwd()}/${typesPath}`,
      `${callingPath}/${dirname(typesPath)}/`
    );

    logger.info(
      chalkTemplate`finished running the {bold layer} subtask successfully`
    );
    return true;
  };

  const layerRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold layer} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold layer} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [layer],
    revert: [layerRevert],
  };

  const typesVariable = 'layer-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command,
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} layer command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: layer command with types variable {bold ${typesVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(typesVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} layer command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: layer command with types variable {bold ${typesVariable}}`
    );
};

export default run;
