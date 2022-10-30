import os from 'os';
import winston from 'winston';
import chalkTemplate from 'chalk-template';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import {
  InfluxDB,
  Point,
  QueryApi,
  WriteApi
} from '@influxdata/influxdb-client';
import { PerformanceObserver, performance } from 'perf_hooks';
import { AnalyticsUtil, Timing } from '../../types/index.js';

const variables = config().parsed;
const url =
  (variables && variables.INFLUXDB_URL) || process.env.INFLUXDB_URL || '';
const token =
  (variables && variables.INFLUXDB_TOKEN) || process.env.INFLUXDB_TOKEN || '';
const org =
  (variables && variables.INFLUXDB_ORG) || process.env.INFLUXDB_ORG || '';
const bucket =
  (variables && variables.INFLUXDB_BUCKET) || process.env.INFLUXDB_BUCKET || '';

export default (logger: winston.Logger): AnalyticsUtil => {
  const subCmdLogger = logger.child({ utility: true });
  const subCommandTimings: {
    name: string;
    time: number;
  }[] = [];

  let writeApi: WriteApi;
  let queryApi: QueryApi;
  let obs: PerformanceObserver;

  let uuid: string;
  let moduleName: string;
  let commandName: string;
  let instanceName: string;

  const analyticsActive =
    (url &&
      url.length > 0 &&
      token &&
      token.length > 0 &&
      org &&
      org.length > 0 &&
      bucket &&
      bucket.length > 0) ||
    false;

  const writeTiming = (subCommandName: string, ms: number): void => {
    subCommandTimings.push({
      name: subCommandName,
      time: ms
    });
  };

  const getAverageTiming = async (): Promise<Timing[]> => {
    const fluxQuery = [
      `from(bucket: "${bucket}")`,
      '|> range(start: -180d, stop: now())',
      '|> filter(fn: (r) => r._measurement == "timing")',
      `|> filter(fn: (r) => r.module == "${moduleName}")`,
      `|> filter(fn: (r) => r.command == "${commandName}")`,
      '|> group(columns: ["_field"])',
      '|> mean(column: "_value")',
      '|> yield(name: "mean")'
    ].join(' ');

    const rows: Timing[] = [];
    const results = new Promise<Timing[]>((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          rows.push(tableMeta.toObject(row) as Timing);
        },
        error(error) {
          reject(error);
        },
        complete() {
          resolve(rows);
        }
      });
    });

    return results;
  };

  const timeStart = async (name: string, category: string): Promise<void> => {
    performance.mark(`${moduleName}.${commandName}.${category}.${name}.start`);
  };

  const timeEnd = async (name: string, category: string): Promise<void> => {
    performance.mark(`${moduleName}.${commandName}.${category}.${name}.end`);

    performance.measure(
      `${moduleName}.${commandName}.${category}.${name}`,
      `${moduleName}.${commandName}.${category}.${name}.start`,
      `${moduleName}.${commandName}.${category}.${name}.end`
    );
  };

  const init = (
    moduleString: string,
    commandString: string,
    instanceString: string
  ): void => {
    uuid = uuidv4();

    moduleName = moduleString;
    commandName = commandString;
    instanceName = instanceString;

    writeApi = new InfluxDB({ url, token }).getWriteApi(org, bucket);
    writeApi.useDefaultTags({
      user: os.userInfo().username,
      os: os.platform(),
      version: os.release()
    });

    queryApi = new InfluxDB({ url, token }).getQueryApi(org);

    obs = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0];

      if (entry.name.indexOf(`${moduleName}.${commandName}`) > -1) {
        const [, , , name] = entry.name.split('.');

        writeTiming(name, entry.duration);
      }
    });
    obs.observe({ entryTypes: ['measure'] });
  };

  const close = async (): Promise<void> => {
    const timing = new Point('timing')
      .tag('uuid', uuid)
      .tag('module', moduleName)
      .tag('command', commandName);

    subCommandTimings.forEach((subCommandTiming) => {
      timing.intField(subCommandTiming.name, subCommandTiming.time);
    });

    if (instanceName) timing.tag('instance', instanceName);

    subCmdLogger.debug(
      chalkTemplate`writing timing metrics for module {bold ${moduleName}} and command {bold ${commandName}}`
    );

    obs.disconnect();
    performance.clearMarks();

    writeApi.writePoint(timing);
    return writeApi.close();
  };

  return {
    analyticsActive,
    helper: {
      init,
      writeTiming,
      getAverageTiming,
      close,
      timeStart,
      timeEnd
    }
  };
};

// TODO:
// * add util timings
// * add htaccess to influxdb.ruhmesmeile.tools

/*
from(bucket: "kickstartDS")
  |> range(start: -180d, stop: now())
  |> filter(fn: (r) => r._measurement == "timing")
  |> filter(fn: (r) => r.command == "checkout")
  |> group(columns: ["_field"])
  |> mean(column: "_value")
  |> yield(name: "mean")
*/

/*
from(bucket: "kickstartDS")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => (r._measurement == "timing") and (r._field == "ms"))
  |> group(columns: ["subcommand"], mode:"by")
  |> window(every: 60m)
  |> mean(column: "_value")
  |> duplicate(column: "_stop", as: "_time")
  |> window(every: inf)
*/

/*
from(bucket: "kickstartDS")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r._measurement == "timing")
  |> group(columns: ["command", "uuid"])
  |> sum(column: "_value")
  |> group(columns: ["command"])
  |> mean(column: "_value")
  |> yield(name: "sum")
*/

/*
from(bucket: "kickstartDS")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => (r._measurement == "timing") and (r.command == "checkout"))
  |> group(columns: ["command", "uuid", "_time"])
  |> sum(column: "_value")
  |> group(columns: ["command"])
*/
