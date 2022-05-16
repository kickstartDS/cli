import winston from 'winston';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';

export default (logger: winston.Logger, json: JsonUtil): NpmUtil => {
  const subCmdLogger = logger.child({ utility: true });

  const getVersion = (packageName: string): string =>
    shell
      .exec(['npm', 'show', packageName, 'version'].join(' '))
      .toString()
      .trim();

  const install = async (): Promise<string> => {
    subCmdLogger.info(
      chalkTemplate`installing npm dependencies according to {bold package.json}`
    );

    const promise = new Promise<string>((resolve, reject) => {
      // TODO I think this should be needed, errors out unfortunately
      // shell.exec(['nvm', 'use']);
      shell.exec(['npm', 'install'].join(' '), (code, stdout, stderr) => {
        if (code > 0) reject(stderr);
        else {
          subCmdLogger.info(
            chalkTemplate`finished installing npm dependencies according to {bold package.json}`
          );
          resolve(stdout);
        }
      });
    });

    return promise;
  };

  const installDependency = async (
    dependency: string,
    version: string
  ): Promise<string> => {
    subCmdLogger.info(
      chalkTemplate`installing npm dependency {bold ${dependency}}`
    );

    const promise = new Promise<string>((resolve, reject) => {
      // TODO I think this should be needed, errors out unfortunately
      // shell.exec(['nvm', 'use']);
      const cmdArgs = ['npm', 'install', '--save'];

      if (version) {
        cmdArgs.push(`${dependency}@${version}`);
      } else {
        cmdArgs.push(dependency);
      }

      shell.exec(cmdArgs.join(' '), (code, stdout, stderr) => {
        if (code > 0) reject(stderr);
        else {
          if (version) {
            subCmdLogger.info(
              chalkTemplate`finished installing npm dependency {bold ${dependency}} with version {bold ${version}}`
            );
          } else {
            subCmdLogger.info(
              chalkTemplate`finished installing npm dependency {bold ${dependency}}`
            );
          }

          resolve(stdout);
        }
      });
    });

    return promise;
  };

  const installDependencies = async (
    dependencies: string[] = []
  ): Promise<string> => {
    subCmdLogger.info(
      chalkTemplate`adding and installing {bold ${dependencies.length}} npm dependencies`
    );

    dependencies.forEach((dependency) => {
      const latestVersion = getVersion(dependency);
      json.helper.addValueToArray(
        '.dependencies',
        {
          [dependency]: latestVersion
        },
        'package.json'
      );

      subCmdLogger.info(
        chalkTemplate`added {bold ${dependency}} with version {bold ${latestVersion}} to {bold package.json}`
      );
    });
    const result = install();

    result.then(() =>
      subCmdLogger.info(
        chalkTemplate`finished adding and installing {bold ${dependencies.length}} npm dependencies`
      )
    );
    return result;
  };

  const uninstallDependency = async (dependency: string): Promise<string> => {
    subCmdLogger.info(
      chalkTemplate`uninstalling npm dependency {bold ${dependency}}`
    );

    const promise = new Promise<string>((resolve, reject) => {
      // TODO I think this should be needed, errors out unfortunately
      // shell.exec(['nvm', 'use']);
      const cmdArgs = ['npm', 'uninstall', '--save', dependency];
      shell.exec(cmdArgs.join(' '), (code, stdout, stderr) => {
        if (code > 0) reject(stderr);
        else {
          subCmdLogger.info(
            chalkTemplate`finished uninstalling npm dependency {bold ${dependency}}`
          );
          resolve(stdout);
        }
      });
    });

    return promise;
  };

  const unpublishPackage = (packageName: string): string => {
    subCmdLogger.info(
      chalkTemplate`removing npm package {bold ${packageName}}`
    );

    // TODO I think this should be needed, errors out unfortunately
    // shell.exec(['nvm', 'use']);
    const result = shell.exec(
      ['npm', 'unpublish', '--force', packageName].join(' ')
    );

    subCmdLogger.info(
      chalkTemplate`finished removing npm package {bold ${packageName}}`
    );
    return result;
  };

  return {
    helper: {
      getVersion,
      install,
      installDependency,
      installDependencies,
      uninstallDependency,
      unpublishPackage
    }
  };
};
