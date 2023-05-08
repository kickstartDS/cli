import { dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const cache: Record<string, string> = {};

export const packagePath = (packageName: string, callingPath?: string) => {
  return (cache[packageName] ??= dirname(
    require.resolve(packageName + '/package.json', {
      paths: callingPath ? [callingPath] : undefined,
    })
  ));
};
