import winston from 'winston';
import chalkTemplate from 'chalk-template';
import { CMSResult, SchemaUtil } from '../../types/index.js';
import {
  getCustomSchemaIds,
  getSchemaModule,
  getSchemaName,
  getSchemaRegistry,
  getUniqueSchemaIds,
  isLayering,
  layeredSchemaId,
  shouldLayer,
  dereference,
  getSchemaDefaults,
  IClassifierResult,
  processSchemaGlobs,
} from '@kickstartds/jsonschema-utils';
import type { IStoryblokBlock } from '@kickstartds/jsonschema2storyblok';
import type { IStaticCmsField } from '@kickstartds/jsonschema2staticcms';
import { pascalCase } from 'change-case';
import type { DataModel, ObjectModel, PageModel } from '@stackbit/types';
import { defaultTitleFunction } from '@kickstartds/jsonschema2types';
import { JSONSchema4 } from 'json-schema';

const renderImportName = (schemaId: string) =>
  `${pascalCase(getSchemaName(schemaId))}Props`;

export default (logger: winston.Logger): SchemaUtil => {
  const subCmdLogger = logger.child({ utility: true });

  const dereferenceSchemas = async (
    schemaGlobs: string[],
    defaultPageSchema = true,
    layerKickstartdsComponents = true
  ) => {
    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlobs(schemaGlobs, ajv, {
      loadPageSchema: defaultPageSchema,
      layerRefs: layerKickstartdsComponents,
    });
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const dereffedSchemas = await dereference(customSchemaIds, ajv);

    subCmdLogger.info(
      chalkTemplate`dereferencing {bold ${
        Object.keys(dereffedSchemas).length
      } component definitions}`
    );
    return dereffedSchemas;
  };

  /**
   * Conserve this for now, might want to come back to this later
   */
  // const packageJson = await readJSON(`${callingPath}/package.json`);
  // const escaped = packageJson?.kickstartDS?.schemaMappings
  //   ? escapeRegex(
  //       Object.keys(packageJson?.kickstartDS?.schemaMappings).join('|')
  //     )
  //   : 'notfound';
  // const nodeResolverRegExp = new RegExp(
  //   `^(${escaped})([a-z-_]+)\.(?:schema|definitions)\.json$`
  // );
  // const nodeResolver = {
  //   canRead: new RegExp(`^${escaped}`, 'i'),
  //   async read(file: FileInfo) {
  //     const result = nodeResolverRegExp.exec(file.url);
  //     if (result && result.length > 1) {
  //       const [, schemaDomain, name] = result;
  //       const npmPackage =
  //         packageJson?.kickstartDS?.schemaMappings[schemaDomain].package;
  //       const modulePath = dirname(
  //         resolve([`${npmPackage}/package.json`], {
  //           paths: [callingPath],
  //         })
  //       );
  //       const [resolvedPath] = await glob(
  //         `${modulePath}/${componentsPath}/**/${name}/${name}.(schema|definitions).json`
  //       );
  //       return readJSON(resolvedPath);
  //     }
  //   },
  // };

  const generateComponentPropTypes = async (
    schemaGlobs: string[],
    mergeAllOf: boolean,
    defaultPageSchema = true,
    layerKickstartdsComponents = true,
    typeNaming = 'title',
    componentsPath = 'src/components'
  ) => {
    subCmdLogger.info(
      chalkTemplate`generating component prop types for component schemas`
    );

    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlobs(schemaGlobs, ajv, {
      typeResolution: false,
      mergeAllOf: mergeAllOf,
      loadPageSchema: defaultPageSchema,
      layerRefs: layerKickstartdsComponents,
    });
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const renderImportStatement = (schemaId: string) =>
      schemaId.includes('schema.kickstartds.com')
        ? `import type { ${pascalCase(
            getSchemaName(schemaId)
          )}Props } from '@kickstartds/${getSchemaModule(
            schemaId
          )}/lib/${getSchemaName(schemaId)}/typing'`
        : componentsPath.startsWith('node_modules/') &&
          !schemaId.startsWith('http://cms.')
        ? `import type { ${pascalCase(
            getSchemaName(schemaId)
          )}Props } from '${componentsPath
            .split('/')
            .slice(1, 3)
            .join('/')}/${getSchemaName(schemaId)}'`
        : `import type { ${pascalCase(
            getSchemaName(schemaId)
          )}Props } from '../${getSchemaName(schemaId)}/${pascalCase(
            getSchemaName(schemaId)
          )}Props'`;

    const idTitleFunction = (schema: JSONSchema4): string =>
      `${pascalCase(getSchemaName(schema.$id))}Props`;

    const convertedTs = await (
      await import('@kickstartds/jsonschema2types')
    ).createTypes(
      customSchemaIds,
      renderImportName,
      renderImportStatement,
      ajv,
      {},
      typeNaming === 'id' ? idTitleFunction : defaultTitleFunction
    );

    return convertedTs;
  };

  const layerComponentPropTypes = async (
    schemaGlobs: string[],
    mergeAllOf: boolean,
    defaultPageSchema = true,
    layerKickstartdsComponents = true
  ) => {
    subCmdLogger.info(
      chalkTemplate`layering component prop types for component schemas`
    );

    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlobs(schemaGlobs, ajv, {
      typeResolution: false,
      mergeAllOf: mergeAllOf,
      loadPageSchema: defaultPageSchema,
      layerRefs: layerKickstartdsComponents,
    });
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
            ? 'TextMediaLazyImage'
            : `Text${importedName}`
          : importedName
      }Props${
        schemaId.includes('text-media') ? ` as ${importedName}Props` : ''
      } } from '@kickstartds/${getSchemaModule(layeredId)}/lib/${getSchemaName(
        layeredId
      )}/typing'`;
    };

    const convertedTs = await (
      await import('@kickstartds/jsonschema2types')
    ).createTypes(
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

  const createDefaultObjects = async (
    schemaGlobs: string[],
    defaultPageSchema = true,
    layerKickstartdsComponents = true
  ) => {
    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlobs(schemaGlobs, ajv, {
      loadPageSchema: defaultPageSchema,
      layerRefs: layerKickstartdsComponents,
    });
    const kdsSchemaIds = schemaIds.filter((schemaId) =>
      schemaId.includes('schema.kickstartds.com')
    );
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const defaultObjects: Record<string, unknown> = {};
    for (const schemaId of customSchemaIds) {
      defaultObjects[schemaId] = await getSchemaDefaults(schemaId, ajv);
    }

    const getImportName = (schemaId: string) => {
      const layeredId = isLayering(schemaId, kdsSchemaIds)
        ? layeredSchemaId(schemaId, kdsSchemaIds)
        : schemaId;
      return `${pascalCase(getSchemaName(layeredId))}Props`;
    };

    for (const schemaId of Object.keys(defaultObjects)) {
      defaultObjects[schemaId] = `import { DeepPartial } from "../helpers";
import { ${getImportName(schemaId)} } from "./${getImportName(schemaId)}";

const defaults: DeepPartial<${getImportName(schemaId)}> = ${JSON.stringify(
        defaultObjects[schemaId],
        null,
        2
      )};

export default defaults;`;
    }

    subCmdLogger.info(
      chalkTemplate`creating {bold ${
        Object.keys(defaultObjects).length
      } default objects}`
    );
    return defaultObjects;
  };

  const toStoryblok = async (
    schemaGlobs: string[],
    templates: string[],
    globals: string[],
    components: string[]
  ) => {
    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlobs(schemaGlobs, ajv, {
      hideCmsFields: true,
    });
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const result = await (
      await import('@kickstartds/jsonschema2storyblok')
    ).convert({
      schemaIds: customSchemaIds.filter((customSchemaId) =>
        templates.includes(getSchemaName(customSchemaId))
      ),
      ajv,
      schemaClassifier: (schemaId: string) => {
        const name = getSchemaName(schemaId);
        if (templates && templates.includes(name)) {
          return IClassifierResult.Template;
        } else if (globals && globals.includes(name)) {
          return IClassifierResult.Global;
        } else if (components && components.includes(name)) {
          return IClassifierResult.Component;
        } else {
          return IClassifierResult.Object;
        }
      },
    });

    subCmdLogger.info(chalkTemplate`creating {bold Storyblok} elements`);
    return result;
  };

  const toStoryblokConfig = async (elements: CMSResult<IStoryblokBlock>) =>
    (await import('@kickstartds/jsonschema2storyblok')).configuration(elements);

  const toUniform = async (
    schemaGlobs: string[],
    templates: string[],
    globals: string[]
  ) => {
    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlobs(schemaGlobs, ajv, {
      hideCmsFields: true,
    });
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const result = await (
      await import('@kickstartds/jsonschema2uniform')
    ).convert({
      schemaIds: customSchemaIds,
      ajv,
      schemaClassifier: (schemaId: string) => {
        const name = getSchemaName(schemaId);
        if (templates && templates.includes(name)) {
          return IClassifierResult.Template;
        } else if (globals && globals.includes(name)) {
          return IClassifierResult.Global;
        } else {
          return IClassifierResult.Component;
        }
      },
    });

    subCmdLogger.info(chalkTemplate`creating {bold Uniform} elements`);
    return result;
  };

  const toStackbit = async (
    schemaGlobs: string[],
    templates: string[],
    globals: string[],
    components: string[]
  ) => {
    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlobs(schemaGlobs, ajv, {
      hideCmsFields: true,
    });
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const result = await (
      await import('@kickstartds/jsonschema2stackbit')
    ).convert({
      schemaIds: customSchemaIds.filter((customSchemaId) =>
        templates.includes(getSchemaName(customSchemaId))
      ),
      ajv,
      schemaClassifier: (schemaId: string) => {
        const name = getSchemaName(schemaId);
        if (templates && templates.includes(name)) {
          return IClassifierResult.Template;
        } else if (globals && globals.includes(name)) {
          return IClassifierResult.Global;
        } else if (components && components.includes(name)) {
          return IClassifierResult.Component;
        } else {
          return IClassifierResult.Object;
        }
      },
    });

    subCmdLogger.info(chalkTemplate`creating {bold Stackbit} elements`);
    return result;
  };

  const toStackbitConfig = async (
    elements: CMSResult<ObjectModel, PageModel, DataModel>
  ) =>
    (await import('@kickstartds/jsonschema2stackbit')).configuration(elements);

  const toStaticcms = async (
    schemaGlobs: string[],
    templates: string[],
    globals: string[]
  ) => {
    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlobs(schemaGlobs, ajv, {
      hideCmsFields: true,
    });
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const result = await (
      await import('@kickstartds/jsonschema2staticcms')
    ).convert({
      schemaIds: customSchemaIds,
      ajv,
      schemaClassifier: (schemaId: string) => {
        const name = getSchemaName(schemaId);
        if (templates && templates.includes(name)) {
          return IClassifierResult.Template;
        } else if (globals && globals.includes(name)) {
          return IClassifierResult.Global;
        } else {
          return IClassifierResult.Component;
        }
      },
    });

    subCmdLogger.info(chalkTemplate`creating {bold Static CMS} elements`);
    return result;
  };

  const toStaticcmsConfig = async (elements: CMSResult<IStaticCmsField>) =>
    (await import('@kickstartds/jsonschema2staticcms')).configuration(elements);

  return {
    helper: {
      dereferenceSchemas,
      generateComponentPropTypes,
      layerComponentPropTypes,
      createDefaultObjects,
      toStoryblok,
      toStoryblokConfig,
      toUniform,
      toStackbit,
      toStackbitConfig,
      toStaticcms,
      toStaticcmsConfig,
    },
  };
};
