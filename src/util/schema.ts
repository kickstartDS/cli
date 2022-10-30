
import winston from 'winston';
import shell from 'shelljs';
import chalkTemplate from 'chalk-template';
import refParser, { FileInfo } from "json-schema-ref-parser";
import merge from "json-schema-merge-allof";
import traverse from "json-schema-traverse";
import glob from "fast-glob";
import fsExtra from "fs-extra";
import { JSONSchema7 } from 'json-schema';
import { SchemaUtil } from '../../types/index.js';

const readJSON = fsExtra.readJSON;

const $RefParser = refParser.default;
const { pwd } = shell;

export default (logger: winston.Logger): SchemaUtil => {
  const subCmdLogger = logger.child({ utility: true });

  const dereferenceSchemas = async (
    schemaPaths: string[],
    callingPath: string,
    componentsPath: string,
  ) => {
    const kdsUrlRegExp = new RegExp('^http:\/\/schema\.kickstartds\.com\/([a-z-_]+)\/([a-z-_/]+)\.(?:schema|definitions)\.json$', 'i');

    const kdsResolver = {
      canRead: /^http:\/\/schema\.kickstartds\.com/i,
      async read(file: FileInfo) {
        const result = kdsUrlRegExp.exec(file.url);
        if (result && result.length > 2) {
          const [, module, name] = result;
          const [resolvedPath] = await glob(
            `/home/julrich/Projects/kickstartDS/code/kickstartdspoc/node_modules/@kickstartds/${module}/lib/${name === 'lightbox-lazy-image' ? 'lightbox-image' : name}/${name}.(schema|definitions).json`
          );
          return readJSON(resolvedPath);
        }
      },
    };

    const customUrlRegExp = new RegExp('^http:\/\/schema\.uniform\.dev\/([a-z-_]+)\.(?:schema|definitions)\.json$');

    const customResolver = {
      canRead: /^http:\/\/schema\.uniform\.dev/i,
      async read(file: FileInfo) {
        const result = customUrlRegExp.exec(file.url);
        if (result && result.length > 1) {
          const [, name] = result;
          const [resolvedPath] = await glob(
            `/home/julrich/Projects/kickstartDS/code/kickstartdspoc/${componentsPath}/**/${name}/${name}.(schema|definitions).json`
          );
          return readJSON(resolvedPath);
        }
      },
    };

    const parseSchema = (
      schemaPath: string,
    ) =>
      new $RefParser().dereference(schemaPath, {
        resolve: {
          kds: {
            order: 1,
            ...kdsResolver,
          },
          custom: {
            order: 2,
            ...customResolver,
          },
        },
      }) as Promise<JSONSchema7>;

    subCmdLogger.info(chalkTemplate`dereferencing {bold ${schemaPaths.length} component definitions}`);
    return Promise.all(schemaPaths.map((schemaPath) => parseSchema(schemaPath)) as Promise<JSONSchema7>[]);
  };

  const generateComponentPropTypes = (
    schemas: JSONSchema7[],
  ) => {
    subCmdLogger.info(chalkTemplate`generating component prop types for {bold ${schemas.length}} component schemas`)

    return {
      demo: 'test'
    }
  };

  return {
    helper: {
      dereferenceSchemas,
      generateComponentPropTypes,
    }
  };
};
