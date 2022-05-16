/* eslint-disable no-underscore-dangle */
import winston from 'winston';
import chalkTemplate from 'chalk-template';
import shell from 'shelljs';
import ProgressBarTransport from './progressbar-transport.js';

const { ls } = shell;

const consoleTransports: Record<
  string,
  winston.transports.ConsoleTransportInstance
> = {};
const fileTransports: Record<string, winston.transports.FileTransportInstance> =
  {};
const progressBarTransports: Record<string, ProgressBarTransport> = {};

// TODO fix logging to files, seems to be broken
// TODO parse out `-step` in step-loggings

const { format: winstonFormat } = winston;
const {
  combine: winstonCombine,
  timestamp: winstonTimestamp,
  label: winstonLabel,
  printf: winstonPrintf,
  colorize: winstonColorize
} = winstonFormat;

const cliStringConsole = chalkTemplate`{bold.keyword('orange') kickstartDS}`;
const labelStringConsole = (label: string) =>
  chalkTemplate`{keyword('fuchsia') ${label}}`;
const commandStringConsole = (command: string, subcommand = '') => {
  if (!command) return '';
  if (subcommand)
    return chalkTemplate`{bold.keyword('grey') ${command}}{keyword('grey') ${
      subcommand ? `: ${subcommand}` : ''
    }}`;

  return chalkTemplate`{bold.keyword('grey') ${command}}{keyword('grey') ${
    subcommand ? `-${subcommand}` : ''
  }}`;
};
const errorStringConsole = (error: ErrorLogEntry) => error.message;
const errorsStringConsole = (errorsArray: ErrorLogEntry[]) => {
  if (errorsArray && errorsArray.length) {
    return chalkTemplate` {keyword('grey') ${errorsArray.reduce(
      (errors, error) => errors + errorStringConsole(error),
      ''
    )}}`;
  }

  return '';
};

const cliStringFile = 'kickstartDS';
const commandStringFile = (command: string, subcommand = '') => {
  if (!command) return '';
  if (subcommand) return `${command}${subcommand ? `: ${subcommand}` : ''}`;

  return chalkTemplate`${command}${subcommand ? `-${subcommand}` : ''}`;
};
const errorStringFile = (error: ErrorLogEntry) => error.message;
const errorsStringFile = (errorsArray: ErrorLogEntry[]) => {
  if (errorsArray && errorsArray.length) {
    return chalkTemplate` ${errorsArray.reduce(
      (errors, error) => errors + errorStringFile(error),
      ''
    )}`;
  }

  return '';
};

const kickstartdsFormatConsoleTemplateFn = ({
  level,
  message,
  label,
  command,
  subcommand,
  errors,
  utility,
  step,
  numSteps
}: winston.Logform.TransformableInfo): string => {
  if (utility) return `[${level}] ${message}${errorsStringConsole(errors)}`;
  if (!command)
    return `[${cliStringConsole}: ${labelStringConsole(
      label
    )}] ${level}: ${message}${errorsStringConsole(errors)}`;
  if (subcommand)
    return `${
      step && numSteps
        ? chalkTemplate`[{bold.keyword('grey') ${step}}/{bold.keyword('grey') ${numSteps}}] `
        : ''
    }[${commandStringConsole(
      command,
      subcommand
    )}] ${level}: ${message}${errorsStringConsole(errors)}`;

  return `[${cliStringConsole}: ${labelStringConsole(
    label
  )}/${commandStringConsole(
    command,
    subcommand
  )}] ${message}${errorsStringConsole(errors)}`;
};
const kickstartdsFormatConsole = winstonPrintf(
  kickstartdsFormatConsoleTemplateFn
);

const rmFormatFile = winstonPrintf(
  ({ level, message, label, timestamp, command, subcommand, errors }) =>
    `${timestamp} [${cliStringFile}: ${label}/${commandStringFile(
      command,
      subcommand
    )}] ${level}: ${message}${errorsStringFile(errors)}`
);

let logIndex = 0;

const createConsoleTransport = (label: string, level: string) =>
  new winston.transports.Console({
    level,
    format: winstonCombine(
      winstonColorize(),
      winstonLabel({ label }),
      winstonTimestamp(),
      kickstartdsFormatConsole
    )
  });

const createFileTransport = (label: string, level: string, fileName: string) =>
  new winston.transports.File({
    level,
    filename: fileName,
    format: winstonCombine(
      winstonLabel({ label }),
      winstonTimestamp(),
      rmFormatFile
    )
  });

const createProgressBarTransport = (
  label: string,
  level: string,
  timings: Timing[]
) =>
  new ProgressBarTransport({
    level,
    format: winstonCombine(
      winstonColorize(),
      winstonLabel({ label }),
      winstonTimestamp(),
      kickstartdsFormatConsole
    ),
    formatConsole: kickstartdsFormatConsoleTemplateFn,
    timings
  });

const savedConsoleTransports: Record<
  string,
  winston.transports.ConsoleTransportInstance
> = {};
// TODO do away with that `any` coming up...
export const addProgressBarTransport = (
  label: string,
  timings: Timing[]
): ProgressBarTransport | false => {
  const summedTimings = timings.reduce(
    (acc, subtiming) => acc + subtiming._value,
    0
  );
  if (
    timings.length > 0 &&
    summedTimings > 2500 &&
    winston.loggers.has(label)
  ) {
    const logger = winston.loggers.get(label);
    const consoleTransport = consoleTransports[label];

    savedConsoleTransports[label] = consoleTransport;
    logger.remove(consoleTransport);

    const progressBarTransport = createProgressBarTransport(
      label,
      consoleTransport.level || 'warn',
      timings
    );

    logger.add(progressBarTransport);
    progressBarTransports[label] = progressBarTransport;

    process.stdout.write('\x1B[?25l');

    return progressBarTransport;
  }

  return false;
};

export const removeProgressBarTransport = (label: string): boolean => {
  if (winston.loggers.has(label)) {
    const logger = winston.loggers.get(label);
    const consoleTransport = savedConsoleTransports[label];
    const progressBarTransport = progressBarTransports[label];

    logger.remove(progressBarTransport);
    logger.add(consoleTransport);

    delete savedConsoleTransports[label];
    delete progressBarTransports[label];

    progressBarTransport.stopIntervals();
    process.stdout.write('\x1B[?25h');
  }

  return true;
};

export const getLogger = (
  label: string,
  level = 'info',
  consoleTransport = true,
  fileTransport = true,
  command = ''
): winston.Logger => {
  if (!winston.loggers.has(label)) {
    const loggerOptions: winston.LoggerOptions = {
      transports: [],
      format: winston.format.label({ label })
    };

    if (consoleTransport) {
      const transport = createConsoleTransport(label, level);
      if (Array.isArray(loggerOptions.transports)) {
        loggerOptions.transports.push(transport);
      }
      consoleTransports[label] = transport;
    }

    if (fileTransport) {
      const silentStatus = shell.config.silent;
      shell.config.silent = true;
      const lsResult = ls('-A', `.${label}-${command}rc.log`);
      if (lsResult.code === 0 && lsResult.length) logIndex = 1;

      const logCount = ls('-A', `.${label}-${command}rc.*.log`);
      shell.config.silent = silentStatus;
      if (logCount.code === 0 && logCount.length)
        logIndex = logCount.length + 1;
      const fileName = `.${label}${command ? `-${command}rc` : 'rc'}${
        logIndex ? `.${logIndex - 1}` : ''
      }.log`;
      const transport = createFileTransport(label, level, fileName);
      if (Array.isArray(loggerOptions.transports)) {
        loggerOptions.transports.push(transport);
      }
      fileTransports[label] = transport;
    }

    winston.loggers.add(label, loggerOptions);
  } else {
    const logger = winston.loggers.get(label);

    if (consoleTransport) {
      if (!consoleTransports[label]) {
        const transport = createConsoleTransport(label, level);
        logger.add(transport);
        consoleTransports[label] = transport;
      }
    } else if (consoleTransports[label]) {
      logger.remove(consoleTransports[label]);
      delete consoleTransports[label];
    }

    if (fileTransport) {
      if (!fileTransports[label]) {
        const lsResult = ls('-A', `.${label}-${command}rc.log`);
        if (lsResult.code === 0 && lsResult.length) logIndex = 1;

        const logCount = ls('-A', `.${label}-${command}rc.*.log`);
        if (logCount.code === 0 && logCount.length)
          logIndex = logCount.length + 1;
        const fileName = `.${label}${command ? `-${command}rc` : 'rc'}${
          logIndex ? `.${logIndex - 1}` : ''
        }.log`;
        const transport = createFileTransport(label, level, fileName);
        logger.add(transport);
        fileTransports[label] = transport;
      }
    } else if (fileTransports[label]) {
      logger.remove(fileTransports[label]);
      delete fileTransports[label];
    }
  }

  return winston.loggers.get(label);
};
