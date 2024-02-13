import winston from 'winston';
import fsExtra from 'fs-extra';
import { dirname } from 'path';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import createTask from '../task.js';
import { StepFunction } from '../../../types/index.js';
import { load, dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { IStaticCmsConfig } from '@kickstartds/jsonschema2staticcms';

const writeFile = fsExtra.writeFile;
const readFile = fsExtra.readFile;

const moduleName = 'cms';
const command = 'staticcms';
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
    toStaticcms: schemaToStaticcms,
    toStaticcmsConfig: schemaToStaticcmsConfig,
  },
} = taskUtilSchema;

const run = async (
  componentsPath: string = 'src/components',
  configurationPath: string = 'src/cms',
  updateConfig: boolean = true,
  templates: string[] = ['page', 'blog-post'],
  globals: string[] = ['header', 'footer', 'seo', 'settings', 'blog-overview'],
  components: string[] = [
    'cta',
    'faq',
    'features',
    'gallery',
    'image-text',
    'logos',
    'stats',
    'teaser-card',
    'testimonials',
    'text',
    'blog-teaser',
  ],
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

  const staticcms = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(chalkTemplate`running the {bold staticcms} subtask`);

    const customSchemaGlob = `${callingPath}/${componentsPath}/**/*.(schema|definitions|interface).json`;
    const elements = await schemaToStaticcms(
      customSchemaGlob,
      templates,
      globals,
      components
    );

    shell.mkdir('-p', `${shell.pwd()}/${configurationPath}/`);

    if (updateConfig) {
      const currentConfig: IStaticCmsConfig = (await yamlLoad(
        await readFile(`${callingPath}/${configurationPath}/config.yml`, 'utf8')
      )) as IStaticCmsConfig;

      const configStringStaticcms = schemaToStaticcmsConfig(
        elements,
        currentConfig
      );

      await writeFile(
        `${shell.pwd()}/${configurationPath}/config.yml`,
        configStringStaticcms
      );
    } else {
      const configStringStaticcms = schemaToStaticcmsConfig(elements);

      await writeFile(
        `${shell.pwd()}/${configurationPath}/config.yml`,
        configStringStaticcms
      );
    }

    shell.cp(
      `-r`,
      `${shell.pwd()}/${configurationPath}`,
      `${callingPath}/${dirname(configurationPath)}/`
    );

    logger.info(
      chalkTemplate`finished running the {bold staticcms} subtask successfully`
    );
    return true;
  };

  const staticcmsRevert = async (logger: winston.Logger): Promise<boolean> => {
    logger.info(
      chalkTemplate`{bold reverting} running the {bold staticcms} subtask`
    );

    // TODO implement revert subtask

    logger.info(
      chalkTemplate`{bold reverting} running the {bold staticcms} subtask finished successfully`
    );
    return true;
  };

  const checks: StepFunction[] = [check];

  const tasks: {
    run: StepFunction[];
    revert: StepFunction[];
  } = {
    run: [staticcms],
    revert: [staticcmsRevert],
  };

  const typesVariable = 'staticcms-task';

  const cmdLogger = getLogger(moduleName, 'info', true, false, command).child({
    command,
  });
  if (isRevert)
    cmdLogger.info(
      chalkTemplate`starting: {bold reverting} staticcms command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`starting: staticcms command with types variable {bold ${typesVariable}}`
    );

  await taskInit(null, rcOnly, isRevert, shouldCleanup, debugActive);
  await taskStart(typesVariable, checks, tasks.run, tasks.revert);

  if (isRevert)
    cmdLogger.info(
      chalkTemplate`finished: {bold reverting} staticcms command with types variable {bold ${typesVariable}}`
    );
  else
    cmdLogger.info(
      chalkTemplate`finished: staticcms command with types variable {bold ${typesVariable}}`
    );
};

export default run;
