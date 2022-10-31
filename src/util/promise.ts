import winston from 'winston';
import { PromiseUtil } from '../../types/index.js';

/* eslint-disable no-await-in-loop */
export default (logger: winston.Logger): PromiseUtil => {
  const subCmdLogger = logger.child({ utility: true });

  const alwaysTrueCheck = (
    data: Record<string, unknown>
  ): Record<string, unknown> => data;
  const delayPromise = (ms: number): Promise<unknown> =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const whilePromise = async (
    callback: () => Promise<{ data: Record<string, unknown> }>,
    delay = 1000,
    maxTries = 10,
    successCheck = alwaysTrueCheck
  ): Promise<unknown> =>
    new Promise((resolve, reject) => {
      const invokeCallback = (
        cb: () => Promise<{ data: Record<string, unknown> }>,
        currentTries = 1
      ) => {
        if (currentTries > maxTries) {
          subCmdLogger.error(`maximum retries (${maxTries}) reached, aborting`);
          reject(new Error(`maximum retries (${maxTries}) reached, aborting`));
        } else {
          cb()
            .then((res) => {
              if (successCheck(res.data)) resolve(res.data);
              else reject();
            })
            .catch(() =>
              delayPromise(delay).then(() =>
                invokeCallback(callback, currentTries + 1)
              )
            );
        }
      };

      invokeCallback(callback);
    });

  // @see: https://gist.github.com/Atinux/fd2bcce63e44a7d3addddc166ce93fb2
  const forEachAsync = async <T>(
    array: T[],
    callback: (item: T, index: number, fullArray: T[]) => void
  ): Promise<void> => {
    for (let index = 0; index < array.length; index += 1) {
      await callback(array[index], index, array);
    }
  };

  return {
    helper: {
      alwaysTrue: alwaysTrueCheck,
      delay: delayPromise,
      retry: whilePromise,
      forEach: forEachAsync
    }
  };
};
