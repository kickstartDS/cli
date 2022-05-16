import winston from 'winston';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import { promisify } from 'util';
import { writeFile } from 'fs';

const fsWriteFilePromise = promisify(writeFile);

export default (logger: winston.Logger): JsonUtil => {
  const subCmdLogger = logger.child({ utility: true });

  const copyValue = (
    fromSelector: string,
    fromFile: string,
    toSelector: string,
    toFile: string
  ): void => {
    const fragmentJson = 'fragment.json';

    shell
      .exec(`jq --raw-output '${fromSelector}' ${fromFile}`)
      .to(fragmentJson);
    shell
      .exec(
        `jq --raw-output --slurpfile fragment ${fragmentJson} '${toSelector} = $fragment[0]' ${toFile}`
      )
      .to(toFile);
    shell.rm(fragmentJson);
  };

  const getValue = (selector: string, file: string): string =>
    shell.exec(`jq --raw-output '${selector}' ${file}`).toString().trim();

  const setValue = (
    selector: string,
    value: Record<string, unknown>,
    file: string
  ): void => {
    shell.exec(`jq --raw-output '${selector} = "${value}"' ${file}`).to(file);
  };

  const addValueToArray = (
    selector: string,
    value: Record<string, unknown>,
    file: string
  ): void => {
    shell
      .exec(`jq --raw-output '${selector} += ${JSON.stringify(value)}' ${file}`)
      .to(file);
  };

  const deleteKey = (selector: string, file: string): void => {
    shell.exec(`jq --raw-output 'del(${selector})' ${file}`).to(file);
  };

  const writeToFile = async (
    json: Record<string, unknown>,
    file: string
  ): Promise<void> => {
    subCmdLogger.info(chalkTemplate`writing to file {bold ${file}}`);

    await fsWriteFilePromise(
      `${shell.pwd().toString()}/${file}`,
      JSON.stringify(json)
    );
    shell.exec(`jq --raw-output '.' ${file}`).to(file);
  };

  return {
    helper: {
      copyValue,
      getValue,
      setValue,
      addValueToArray,
      deleteKey,
      writeToFile
    }
  };
};
