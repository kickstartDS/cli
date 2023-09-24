import winston from 'winston';
import fsExtra, { writeFileSync } from 'fs-extra';
import shell from 'shelljs';
import { basename, dirname } from 'path';
import chalkTemplate from 'chalk-template';
import { pascalCase } from 'change-case';
import {
  getCustomSchemaIds,
  getSchemaModule,
  getSchemaName,
  getSchemaRegistry,
  getUniqueSchemaIds,
  isLayering,
  layeredSchemaId,
  processSchemaGlob,
  shouldLayer,
} from '@kickstartds/jsonschema-utils';
import { createTypes } from '@kickstartds/jsonschema2types';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';
import { JSONSchema7 } from 'json-schema';

const writeFile = fsExtra.writeFile;

const moduleName = 'schema';
const command = 'types';
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
  helper: {
    generateComponentPropTypes: schemaGenerateComponentPropTypes,
    dereferenceSchemas: schemaDereferenceSchemas,
    layerComponentPropTypes: schemaLayerComponentPropTypes,
  },
} = taskUtilSchema;

const run = async (
  componentsPath: string = 'src/components',
  typesPath: string = 'src/types',
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

    const customGlob = `${callingPath}/${componentsPath}/**/*.(schema|definitions).json`;

    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlob(customGlob, ajv, false);
    const kdsSchemaIds = schemaIds.filter((schemaId) =>
      schemaId.includes('schema.kickstartds.com')
    );

    const customSchemaIds = getCustomSchemaIds(schemaIds);
    const unlayeredSchemaIds = getUniqueSchemaIds(schemaIds).filter(
      (schemaId) => !customSchemaIds.includes(schemaId)
    );
    const layeredSchemaIds = customSchemaIds.filter((schemaId) =>
      kdsSchemaIds.some((kdsSchemaId) => shouldLayer(schemaId, kdsSchemaId))
    );

    const layeredTypes = await createTypes(
      [...unlayeredSchemaIds, ...layeredSchemaIds],
      ajv
    );

    shell.mkdir('-p', typesPath);

    for (const schemaId of Object.keys(layeredTypes)) {
      const schema = ajv.getSchema(schemaId)?.schema as JSONSchema7;

      if (!schema) throw new Error("Can't find schema for layered type");
      if (!schema.$id) throw new Error('Found schema without $id property');

      const layeredId = isLayering(schema.$id, kdsSchemaIds)
        ? layeredSchemaId(schema.$id, kdsSchemaIds)
        : schema.$id;

      writeFileSync(
        `${typesPath}/${pascalCase(getSchemaName(layeredId))}Props.ts`,
        `declare module "@kickstartds/${getSchemaModule(
          layeredId
        )}/lib/${getSchemaName(layeredId)}/typing" {
  ${layeredTypes[schemaId]}
  }
          `
      );
    }

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
