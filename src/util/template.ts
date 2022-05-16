/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import shell from 'shelljs';
import winston from 'winston';
import nunjucks from 'nunjucks';
import chalkTemplate from 'chalk-template';
import { readFile, writeFile } from 'fs';
import { promisify } from 'util';
import { pascalCase } from 'change-case';

const { configure, Environment, FileSystemLoader } = nunjucks;

const replaceAll = (string: string, mapObj: Record<string, string>): string => {
  const re = new RegExp(Object.keys(mapObj).join('|'), 'gi');
  return string.replace(re, (matched) => mapObj[matched]);
};

const jsonKey = (string: string) => {
  if (string.indexOf('-') > 0) {
    return `'${string}'`;
  }

  return string;
};

// eslint-disable-next-line @typescript-eslint/ban-types
const jsonValue = (string: string | boolean | number | object) => {
  if (string === true || string === false) {
    return string;
  }

  if (typeof string === 'number') {
    return string;
  }

  // TODO try to handle initial whitespace
  // (e.g. when outputting inside existing code block)
  if (typeof string === 'object') {
    return JSON.stringify(string, null, 2);
  }

  return `'${string}'`;
};

const nunjucksCustomFilters = [jsonKey, jsonValue, pascalCase];

const fsReadFilePromise = promisify(readFile);
const fsWriteFilePromise = promisify(writeFile);

export default (logger: winston.Logger): TemplateUtil => {
  const subCmdLogger = logger.child({ utility: true });

  const templateFile = async (
    fileName: string,
    options: Record<string, unknown>
  ): Promise<void> => {
    configure(shell.pwd().toString());

    const nunjucksEnvironment = new Environment(
      new FileSystemLoader(shell.pwd().toString())
    );
    nunjucksCustomFilters.forEach((filter) =>
      nunjucksEnvironment.addFilter(filter.name, filter)
    );

    const render = promisify<string, Record<string, unknown>, string>(
      nunjucksEnvironment.render.bind(nunjucksEnvironment)
    );

    return render(`${shell.pwd().toString()}/${fileName}.njk`, options)
      .then((content) => {
        shell.rm(`${fileName}.njk`);
        subCmdLogger.info(
          chalkTemplate`successfully templated {bold ${fileName}}`
        );
        return fsWriteFilePromise(
          `${shell.pwd().toString()}/${fileName}`,
          content
        );
      })
      .catch((err) => {
        subCmdLogger.error(chalkTemplate`error templating {bold ${fileName}}`, {
          errors: [{ message: JSON.stringify(err) }]
        });
        shell.exit(1);
      });
  };

  const templateFiles = async (
    fileNames: string[] = [],
    options: Record<string, unknown> = {}
  ) => {
    for (const fileName of fileNames) {
      await templateFile(fileName, options);
    }

    return true;
  };

  const replaceInFile = async (
    fileName: string,
    search: string,
    replace: string
  ): Promise<boolean> => {
    await fsReadFilePromise(`${shell.pwd().toString()}/${fileName}`)
      .then((content) => {
        const stringContent = content.toString();
        const replacedContent = stringContent.replace(search, replace);
        subCmdLogger.info(
          chalkTemplate`successfully replaced {bold ${search}} with {bold ${replace}} in {bold ${fileName}}`
        );
        return fsWriteFilePromise(
          `${shell.pwd().toString()}/${fileName}`,
          replacedContent
        );
      })
      .catch((err) => {
        subCmdLogger.error(
          chalkTemplate`error replacing {bold ${search}} with {bold ${replace}} in {bold ${fileName}}`,
          {
            errors: [{ message: JSON.stringify(err) }]
          }
        );
        shell.exit(1);
      });

    return true;
  };

  return {
    helper: {
      replaceAll,
      templateFile,
      templateFiles,
      replaceInFile
    }
  };
};
