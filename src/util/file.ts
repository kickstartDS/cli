import winston from 'winston';
import chalkTemplate from 'chalk-template';
import { writeFile, readFile } from 'fs';
import { promisify } from 'util';
import { FileUtil } from '../../types/index.js';

const fsWriteFilePromise = promisify(writeFile);
const fsReadFilePromise = promisify(readFile);

export default (logger: winston.Logger): FileUtil => {
  const subCmdLogger = logger.child({ utility: true });

  // TODO: this seems not to work sometimes
  // @see: https://stackoverflow.com/a/49432524
  const removeRepeatedEmptyLines = async (filePath: string) => {
    subCmdLogger.info(
      chalkTemplate`removing repeated empty lines from file {bold ${filePath}}`
    );
    let content = await fsReadFilePromise(filePath, 'utf8');

    const EOL = content.match(/\r\n/gm) ? '\r\n' : '\n';
    const regExp = new RegExp(`('${EOL}'){3,}`, 'gm');
    content = content.replace(regExp, EOL + EOL);

    subCmdLogger.info(
      chalkTemplate`successfully removed repeated empty lines from file {bold ${filePath}}`
    );
    return fsWriteFilePromise(filePath, content);
  };

  return {
    helper: {
      removeRepeatedEmptyLines
    }
  };
};
