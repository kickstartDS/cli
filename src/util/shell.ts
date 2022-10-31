import shell from 'shelljs';
import winston from 'winston';
import chalkTemplate from 'chalk-template';
import { ShellUtil } from '../../types/index.js';

const { which, ls, mv, cp, exit } = shell;

export default (logger: winston.Logger): ShellUtil => {
  const subCmdLogger = logger.child({ utility: true });

  let tmpDir: string;

  const setTmpDir = (directory: string): void => {
    tmpDir = directory;
  };

  const requireCommand = (commandName = ''): void => {
    if (!which(commandName)) {
      subCmdLogger.error(
        chalkTemplate`required command "${commandName}" not found on $PATH`
      );
      exit(1);
    } else {
      subCmdLogger.debug(
        chalkTemplate`required command "${commandName}" found at: ${which(
          commandName
        )}`
      );
    }
  };

  const requireCommands = (commandNames: string[] = []): void => {
    commandNames.forEach((commandName) => {
      requireCommand(commandName);
    });
  };

  const fileExistsInCwd = (fileName: string): boolean => {
    const lsResult = ls(fileName);
    return lsResult.code === 0 && lsResult.length > 0;
  };

  const dirExistsInCwd = (dirName: string): boolean => {
    const lsResult = ls('-d', dirName);
    return lsResult.code === 0 && lsResult.length > 0;
  };

  const backupDirInCwd = (dirName: string, prefix = '', move = true): void => {
    if (move)
      mv(dirName, `${tmpDir}/${prefix ? `${prefix}-` : ''}${dirName}-backup`);
    else
      cp(
        '-r',
        dirName,
        `${tmpDir}/${prefix ? `${prefix}-` : ''}${dirName}-backup`
      );
  };

  const restoreDirInCwd = (dirName: string, prefix = '', move = true): void => {
    if (move)
      mv(`${tmpDir}/${prefix ? `${prefix}-` : ''}${dirName}-backup`, dirName);
    else
      cp(
        '-r',
        `${tmpDir}/${prefix ? `${prefix}-` : ''}${dirName}-backup`,
        dirName
      );
  };

  const hasBackedUpDirInCwd = (dirName: string, prefix = ''): boolean => {
    const lsResult = ls(
      '-d',
      `${tmpDir}/${prefix ? `${prefix}-` : ''}${dirName}-backup`
    );
    return lsResult.code === 0 && lsResult.length > 0;
  };

  return {
    helper: {
      setTmpDir,
      requireCommand,
      requireCommands,
      fileExistsInCwd,
      dirExistsInCwd,
      backupDirInCwd,
      restoreDirInCwd,
      hasBackedUpDirInCwd
    }
  };
};
