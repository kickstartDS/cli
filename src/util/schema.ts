import { dirname } from 'path';
import winston from 'winston';
import chalkTemplate from 'chalk-template';
import refParser, { FileInfo } from 'json-schema-ref-parser';
import merge from 'json-schema-merge-allof';
import traverse from 'json-schema-traverse';
import glob from 'fast-glob';
import fsExtra from 'fs-extra';
import { JSONSchema4, JSONSchema7 } from 'json-schema';
import { compile } from 'json-schema-to-typescript';
import { SchemaUtil } from '../../types/index.js';
import { packagePath, require } from './package-path.js';
import {
  getCustomSchemaIds,
  getSchemaModule,
  getSchemaName,
  getSchemaRegistry,
  getSchemasForIds,
  getUniqueSchemaIds,
  isLayering,
  layeredSchemaId,
  processSchemaGlob,
  shouldLayer,
} from '@kickstartds/jsonschema-utils';
import { createTypes } from '@kickstartds/jsonschema2types';
import Ajv from 'ajv';
import { pascalCase } from 'change-case';

/* dereferenceSchemas */
const readJSON = fsExtra.readJSON;
const $RefParser = refParser.default;

// TODO this one, too, is a poor mans version of @kickstartds/jsonschema-utils mergeAnyOfEnums
// which is also used inside the kickstartDS-schema-toolkit for the same purpose
// Should vanish with the rest of the duplicated JSON Schema stuff here
// TODO adding insult to injury: fixed .ts types by adding a bunch of `any`, and falling back
// on potentially empty strings with `|| ''`
const mergeAnyOfEnums = (schema: JSONSchema7) => {
  traverse(schema, {
    cb: (subSchema, pointer, rootSchema) => {
      const propertyName = pointer.split('/').pop();

      if (
        subSchema.anyOf &&
        subSchema.anyOf.length === 2 &&
        subSchema.anyOf.every(
          (anyOf: any) => anyOf.type === 'string' && anyOf.enum
        ) &&
        rootSchema.allOf &&
        rootSchema.allOf.length === 2 &&
        rootSchema.allOf.some(
          (allOf: any) =>
            allOf.properties[propertyName || '']?.type === 'string'
        )
      ) {
        subSchema.type = subSchema.anyOf[0].type;
        subSchema.default = subSchema.anyOf[0].default;
        subSchema.enum = subSchema.anyOf.reduce(
          (enumValues: any, anyOf: any) => {
            anyOf.enum.forEach((value: any) => {
              if (!enumValues.includes(value)) enumValues.push(value);
            });

            return enumValues;
          },
          []
        );

        delete rootSchema.allOf[
          rootSchema.allOf.findIndex(
            (allOf: any) =>
              allOf.properties[propertyName || '']?.type === 'string'
          )
        ].properties[propertyName || ''];
        delete subSchema.anyOf;
      }
    },
  });
};

/* generateComponentPropTypes */
// @see https://github.com/bcherny/json-schema-to-typescript#not-expressible-in-typescript
// TODO fix use of `any` here
function removeUnsupportedProps(obj: any) {
  for (const prop in obj) {
    if (prop === 'oneOf') delete obj[prop];
    else if (typeof obj[prop] === 'object') removeUnsupportedProps(obj[prop]);
  }
  return obj;
}

function resolve(possibleFileNames: string[], options: { paths: string[] }) {
  let error;

  for (const possibleFileName of possibleFileNames) {
    try {
      return require.resolve(possibleFileName, options);
    } catch (e) {
      error = e;
    }
  }

  throw error;
}

const renderImportName = (schemaId: string) =>
  `${pascalCase(getSchemaName(schemaId))}Props`;

function escapeRegex(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export default (logger: winston.Logger): SchemaUtil => {
  const subCmdLogger = logger.child({ utility: true });

  const dereferenceSchemas = async (
    schemaPaths: string[],
    callingPath: string,
    componentsPath: string,
    schemaDomain: string
  ) => {
    const kdsUrlRegExp = new RegExp(
      `^http:\/\/schema\.kickstartds\.com\/([a-z-_]+)\/([a-z-_/]+)\.(?:schema|definitions)\.json$`,
      'i'
    );

    const kdsResolver = {
      canRead: new RegExp(`^http:\/\/schema\.kickstartds\.com`, 'i'),
      async read(file: FileInfo) {
        const result = kdsUrlRegExp.exec(file.url);
        if (result && result.length > 2) {
          const [, module, name] = result;
          const modulePath = packagePath(`@kickstartds/${module}`, callingPath);
          const [resolvedPath] = await glob(
            `${modulePath}/lib/${
              name === 'lightbox-lazy-image' ? 'lightbox-image' : name
            }/${name}.(schema|definitions).json`
          );
          return readJSON(resolvedPath);
        }
      },
    };

    const customUrlRegExp = new RegExp(
      `^http:\/\/${schemaDomain.replaceAll(
        '.',
        '.'
      )}\/([a-z-_]+)\.(?:schema|definitions)\.json$`
    );

    const customResolver = {
      canRead: new RegExp(
        `^http:\/\/${schemaDomain.replaceAll('.', '.')}`,
        'i'
      ),
      async read(file: FileInfo) {
        const result = customUrlRegExp.exec(file.url);
        if (result && result.length > 1) {
          const [, name] = result;
          const [resolvedPath] = await glob(
            `${callingPath}/${componentsPath}/**/${name}/${name}.(schema|definitions).json`
          );
          return readJSON(resolvedPath);
        }
      },
    };

    const packageJson = await readJSON(`${callingPath}/package.json`);
    const escaped = packageJson?.kickstartDS?.schemaMappings
      ? escapeRegex(
          Object.keys(packageJson?.kickstartDS?.schemaMappings).join('|')
        )
      : 'notfound';
    const nodeResolverRegExp = new RegExp(
      `^(${escaped})([a-z-_]+)\.(?:schema|definitions)\.json$`
    );
    const nodeResolver = {
      canRead: new RegExp(`^${escaped}`, 'i'),
      async read(file: FileInfo) {
        const result = nodeResolverRegExp.exec(file.url);
        if (result && result.length > 1) {
          const [, schemaDomain, name] = result;
          const npmPackage =
            packageJson?.kickstartDS?.schemaMappings[schemaDomain].package;
          const modulePath = dirname(
            resolve([`${npmPackage}/package.json`], {
              paths: [callingPath],
            })
          );
          const [resolvedPath] = await glob(
            `${modulePath}/${componentsPath}/**/${name}/${name}.(schema|definitions).json`
          );
          return readJSON(resolvedPath);
        }
      },
    };

    const parseSchema = (schemaPath: string) =>
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
          node: {
            order: 3,
            ...nodeResolver,
          },
        },
      }) as Promise<JSONSchema7>;

    const mergedSchemas: Record<string, JSONSchema7> = {};
    await Promise.all(
      schemaPaths.map(async (schemaPath) => {
        const dereffedSchema = await parseSchema(schemaPath);
        mergeAnyOfEnums(dereffedSchema);
        mergedSchemas[schemaPath] = merge(dereffedSchema, {
          ignoreAdditionalProperties: true,
        });
      })
    );

    subCmdLogger.info(
      chalkTemplate`dereferencing {bold ${schemaPaths.length} component definitions}`
    );
    return mergedSchemas;
  };

  const generateComponentPropTypes = async (schemaGlob: string) => {
    subCmdLogger.info(
      chalkTemplate`generating component prop types for component schemas`
    );

    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlob(schemaGlob, ajv, false);
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const renderImportStatement = (schemaId: string) =>
      schemaId.includes('schema.kickstartds.com')
        ? `import type { ${pascalCase(
            getSchemaName(schemaId)
          )}Props } from '@kickstartds/${getSchemaModule(
            schemaId
          )}/lib/${getSchemaName(schemaId)}/typing'`
        : `import type { ${pascalCase(
            getSchemaName(schemaId)
          )}Props } from '../${getSchemaName(schemaId)}/${pascalCase(
            getSchemaName(schemaId)
          )}Props'`;

    const convertedTs = await createTypes(
      customSchemaIds,
      renderImportName,
      renderImportStatement,
      ajv
    );

    return convertedTs;
  };

  const layerComponentPropTypes = async (schemaGlob: string) => {
    subCmdLogger.info(
      chalkTemplate`layering component prop types for component schemas`
    );

    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlob(schemaGlob, ajv, false);
    const kdsSchemaIds = schemaIds.filter((schemaId) =>
      schemaId.includes('schema.kickstartds.com')
    );
    const customSchemaIds = getCustomSchemaIds(schemaIds);
    const unlayeredSchemaIds = getUniqueSchemaIds(schemaIds).filter(
      (schemaId) => !customSchemaIds.includes(schemaId)
    );
    const layeredSchemaIds = customSchemaIds.filter((schemaId) =>
      kdsSchemaIds.some((kdsSchemaId) => shouldLayer(schemaId, kdsSchemaId))
    );

    const renderImportStatement = (schemaId: string) => {
      const layeredId = isLayering(schemaId, kdsSchemaIds)
        ? layeredSchemaId(schemaId, kdsSchemaIds)
        : schemaId;
      // TODO remove, this is a hack needed because of "broken" conventions
      // in this case of automatic interface schema generation
      const importedName = pascalCase(getSchemaName(layeredId));
      return `import type { ${
        schemaId.includes('text-media')
          ? schemaId.includes('media-lazyimage.interface.json')
            ? 'TextMediaLazyImageProps'
            : `Text${importedName}`
          : importedName
      }Props } from '@kickstartds/${getSchemaModule(
        layeredId
      )}/lib/${getSchemaName(layeredId)}/typing'`;
    };

    const convertedTs = await createTypes(
      [...unlayeredSchemaIds, ...layeredSchemaIds],
      renderImportName,
      renderImportStatement,
      ajv
    );
    for (const schemaId of Object.keys(convertedTs)) {
      const layeredId = isLayering(schemaId, kdsSchemaIds)
        ? layeredSchemaId(schemaId, kdsSchemaIds)
        : schemaId;

      const content = `declare module "@kickstartds/${getSchemaModule(
        layeredId
      )}/lib/${getSchemaName(layeredId)}/typing" {
${convertedTs[schemaId]}
}
      `;

      delete convertedTs[schemaId];
      convertedTs[layeredId] = content;
    }

    return convertedTs;
  };

  return {
    helper: {
      dereferenceSchemas,
      generateComponentPropTypes,
      layerComponentPropTypes,
    },
  };
};
