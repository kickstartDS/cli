import winston from 'winston';
import chalkTemplate from 'chalk-template';
import { SchemaUtil } from '../../types/index.js';
import {
  getCustomSchemaIds,
  getSchemaModule,
  getSchemaName,
  getSchemaRegistry,
  getUniqueSchemaIds,
  isLayering,
  layeredSchemaId,
  processSchemaGlob,
  shouldLayer,
  dereference,
} from '@kickstartds/jsonschema-utils';
import { createTypes } from '@kickstartds/jsonschema2types';
import { convert as convertToStoryblok } from '@kickstartds/jsonschema2storyblok';
import { convert as convertToUniform } from '@kickstartds/jsonschema2uniform';
import { convert as convertToStackbit } from '@kickstartds/jsonschema2stackbit';
import { convert as convertToNetlifycms } from '@kickstartds/jsonschema2netlifycms';
import { pascalCase } from 'change-case';

const renderImportName = (schemaId: string) =>
  `${pascalCase(getSchemaName(schemaId))}Props`;

export default (logger: winston.Logger): SchemaUtil => {
  const subCmdLogger = logger.child({ utility: true });

  const dereferenceSchemas = async (schemaGlob: string) => {
    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlob(schemaGlob, ajv);
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const dereffedSchemas = await dereference(customSchemaIds, ajv);

    subCmdLogger.info(
      chalkTemplate`dereferencing {bold ${dereffedSchemas.length} component definitions}`
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
    schemaGlob: string,
    mergeAllOf: boolean
  ) => {
    subCmdLogger.info(
      chalkTemplate`generating component prop types for component schemas`
    );

    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlob(schemaGlob, ajv, {
      typeResolution: false,
      mergeAllOf: mergeAllOf,
    });
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

  const layerComponentPropTypes = async (
    schemaGlob: string,
    mergeAllOf: boolean
  ) => {
    subCmdLogger.info(
      chalkTemplate`layering component prop types for component schemas`
    );

    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlob(schemaGlob, ajv, {
      typeResolution: false,
      mergeAllOf: mergeAllOf,
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

  const toStoryblok = async (schemaGlob: string) => {
    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlob(schemaGlob, ajv);
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const { components: elements } = await convertToStoryblok({
      schemaIds: customSchemaIds,
      ajv,
    });

    subCmdLogger.info(chalkTemplate`creating {bold Storyblok} elements`);
    return elements;
  };

  const toUniform = async (schemaGlob: string) => {
    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlob(schemaGlob, ajv);
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const { components: elements } = await convertToUniform({
      schemaIds: customSchemaIds,
      ajv,
    });

    subCmdLogger.info(chalkTemplate`creating {bold Uniform} elements`);
    return elements;
  };

  const toStackbit = async (schemaGlob: string) => {
    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlob(schemaGlob, ajv);
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const { components: elements } = await convertToStackbit({
      schemaIds: customSchemaIds,
      ajv,
    });

    subCmdLogger.info(chalkTemplate`creating {bold Stackbit} elements`);
    return elements;
  };

  const toNetlifycms = async (schemaGlob: string) => {
    const ajv = getSchemaRegistry();
    const schemaIds = await processSchemaGlob(schemaGlob, ajv);
    const customSchemaIds = getCustomSchemaIds(schemaIds);

    const { components: elements } = await convertToNetlifycms({
      schemaIds: customSchemaIds,
      ajv,
    });

    subCmdLogger.info(chalkTemplate`creating {bold Netlify CMS} elements`);
    return elements;
  };

  return {
    helper: {
      dereferenceSchemas,
      generateComponentPropTypes,
      layerComponentPropTypes,
      toStoryblok,
      toUniform,
      toStackbit,
      toNetlifycms,
    },
  };
};
