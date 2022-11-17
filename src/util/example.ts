import winston from 'winston';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import { ExampleUtil } from '../../types/index.js';

const { pwd } = shell;

export default (logger: winston.Logger): ExampleUtil => {
  const subCmdLogger = logger.child({ utility: true });

  const demo = (
    output: string,
  ) => {
    subCmdLogger.info(chalkTemplate`calling from path {bold ${pwd().toString()}}`)
    subCmdLogger.info(chalkTemplate`demo output: ${output}`);
  };

  return {
    helper: {
      demo,
    }
  };
};
