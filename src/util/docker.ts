import winston from 'winston';
import Docker from 'dockerode';
import { createStream } from 'byline';
import { config, DotenvParseOutput } from 'dotenv';
import { DockerUtil } from '../../types/index.js';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// TODO check to replace `byline`, unmaintained (5-6 years)
// one fork here: https://github.com/pnpm/node-byline
// maybe use nodejs readline?
// https://github.com/jahewson/node-byline/issues/56
export default (logger: winston.Logger): DockerUtil => {
  const subCmdLogger = logger.child({ utility: true });
  let variables: DotenvParseOutput;

  const run = async (
    name: string,
    image: string,
    command: string[],
    binds: string[] = [],
    envFile = false,
    autoRemove = true
  ) => {
    const logStream = createStream();
    logStream.on('data', (line) => {
      subCmdLogger.info(line);
    });

    if (envFile) {
      variables = config().parsed || {};
    }

    await docker.run(image, command, logStream, {
      name,
      HostConfig: {
        AutoRemove: autoRemove,
        Binds: binds
      },
      Env: Object.entries(variables).map(
        (variable) => `${variable[0]}=${variable[1]}`
      )
    });
  };

  return {
    helper: {
      run
    }
  };
};
