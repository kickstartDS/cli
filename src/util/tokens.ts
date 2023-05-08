import Ajv from 'ajv';
import winston from 'winston';
import StyleDictionary from 'style-dictionary';
import path from 'path';
import shell from 'shelljs';
import traverse from 'json-schema-traverse';
import mergeAllOf from 'json-schema-merge-allof';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import jsonPointer from 'json-pointer';
import chalkTemplate from 'chalk-template';
import { readFile, writeFile } from 'fs';
import { JSONSchema4, JSONSchema7 } from 'json-schema';
import { inlineDefinitions } from '@kickstartds/jsonschema-utils/dist/helpers.js';
import { compile } from 'json-schema-to-typescript';
import { promisify } from 'util';
import { traverse as objectTraverse } from 'object-traversal';
import { createRequire } from 'module';
import * as Figma from 'figma-api';

import { KickstartDSFigmaTokenStructure } from '../../assets/tokens/figma/figma-file.js';
import promiseHelper from './promise.js';
import { TokensUtil } from '../../types/index.js';
import { packagePath } from './package-path.js';

const require = createRequire(import.meta.url);
const tokens = require('@kickstartds/style-dictionary');
const { config, writeTokens } = tokens;

const fsReadFilePromise = promisify(readFile);
const fsWriteFilePromise = promisify(writeFile);

export default (logger: winston.Logger): TokensUtil => {
  const subCmdLogger = logger.child({ utility: true });
  const {
    helper: { forEach },
  } = promiseHelper(logger);

  const ksDSTokenTemplate = {
    'background-color': {},
    'text-color': {},
    color: {},
    spacing: {},
    border: {
      'border-width': {},
      'border-radius': {
        control: {
          value: '4px',
          token: {
            category: 'Border Radius',
            presenter: 'BorderRadius',
          },
        },
        card: {
          value: '6px',
          token: {
            category: 'Border Radius',
            presenter: 'BorderRadius',
          },
        },
        surface: {
          value: '8px',
          token: {
            category: 'Border Radius',
            presenter: 'BorderRadius',
          },
        },
        pill: {
          value: '999px',
          token: {
            category: 'Border Radius',
            presenter: 'BorderRadius',
          },
        },
        circle: {
          value: '50%',
          token: {
            category: 'Border Radius',
            presenter: 'BorderRadius',
          },
        },
      },
    },
    'box-shadow': {},
    transition: {
      'timing-function': {
        bounce: {
          value: 'cubic-bezier(0.17,1,0.5,1.5)',
        },
        'ease-out': {
          value: 'ease-out',
        },
        'ease-in': {
          value: 'ease-in',
        },
        'ease-in-out': {
          value: 'ease-in-out',
        },
        linear: {
          value: 'linear',
        },
      },
      transition: {
        collapse: {
          value: 'duration {ks.timing-function.ease-out}',
        },
        hover: {
          value: 'duration {ks.timing-function.ease-in-out}',
        },
        fade: {
          value: 'duration {ks.timing-function.ease-out}',
        },
      },
    },
    breakpoint: {
      phone: {
        value: '36em',
        private: true,
      },
      tablet: {
        value: '48em',
        private: true,
      },
      laptop: {
        value: '62em',
        private: true,
      },
      desktop: {
        value: '75em',
        private: true,
      },
    },
    deprecated: {
      color: {
        white: {
          value: {
            r: 255,
            g: 255,
            b: 255,
            a: 1,
          },
          attributes: {
            category: 'color',
            deprecated: true,
          },
        },
        error: {
          value: {
            r: 230,
            g: 2,
            b: 1,
            a: 1,
          },
          attributes: {
            category: 'color',
            deprecated: true,
          },
        },
      },
      g: {
        'header-height': {
          value: '0px',
          attributes: {
            deprecated: true,
          },
        },
        'scroll-offset': {
          value: '{g.header-height.value}',
          attributes: {
            deprecated: true,
          },
        },
      },
    },
    typo: {
      'font-family': {},
      'font-weight': {
        light: {
          value: 300,
          token: {
            category: 'Font Weights',
            presenter: 'FontWeight',
          },
        },
        regular: {
          value: 400,
          token: {
            category: 'Font Weights',
            presenter: 'FontWeight',
          },
        },
        'semi-bold': {
          value: 600,
          token: {
            category: 'Font Weights',
            presenter: 'FontWeight',
          },
        },
        bold: {
          value: 700,
          token: {
            category: 'Font Weights',
            presenter: 'FontWeight',
          },
        },
      },
      'font-size': {
        display: {
          'bp-factor': {
            phone: {
              value: 1.167,
            },
            tablet: {
              value: 1.333,
            },
          },
        },
        copy: {
          'bp-factor': {
            tablet: {
              value: 1.125,
            },
          },
        },
        ui: {
          'bp-factor': {
            tablet: {
              value: 1.125,
            },
          },
        },
        mono: {
          'bp-factor': {
            tablet: {
              value: 1.125,
            },
          },
        },
      },
      'line-height': {},
    },
  };

  const generateTokens = async (
    primitiveTokenJson: Record<string, unknown>,
    targetDir: string
  ): Promise<void> => {
    shell.mkdir('-p', targetDir);
    return writeTokens(primitiveTokenJson, targetDir);
  };

  const generateFromPrimitivesJson = async (
    tokenJson: Record<string, unknown>,
    targetDir = 'tokens'
  ): Promise<void> => {
    subCmdLogger.info(
      chalkTemplate`generating your token set from passed {bold primitives} tokens values`
    );

    const result = generateTokens(tokenJson, targetDir);

    subCmdLogger.info(
      chalkTemplate`successfully generated {bold primitives} tokens and wrote them to folder {bold ${targetDir}}`
    );

    return result;
  };

  const generateFromPrimitivesPath = async (
    primitiveTokenPath: string,
    targetDir = 'tokens'
  ): Promise<void> => {
    subCmdLogger.info(
      chalkTemplate`generating your token set from {bold primitives} tokens file {bold ${primitiveTokenPath}}`
    );

    const primitiveTokenJson = JSON.parse(
      await fsReadFilePromise(primitiveTokenPath, 'utf8')
    );
    const result = generateTokens(primitiveTokenJson, targetDir);

    subCmdLogger.info(
      chalkTemplate`successfully generated {bold primitives} tokens and wrote them to folder {bold ${targetDir}}`
    );

    return result;
  };

  const compileTokens = (
    styleDictionary: StyleDictionary.Core,
    platforms: string[]
  ): void =>
    platforms.forEach((platform) => styleDictionary.buildPlatform(platform));

  // TODO add `required` everywhere as needed in figma-tokens.schema.json
  const syncToFigma = async (
    callingPath: string,
    styleDictionary: StyleDictionary.Core
  ): Promise<void> => {
    // const variables = dotEnvConfig().parsed;
    // const personalAccessToken =
    //   (variables && variables.FIGMA_PERSONAL_ACCESS_TOKEN) ||
    //   process.env.FIGMA_PERSONAL_ACCESS_TOKEN ||
    //   '';
    // const fileId =
    //   (variables && variables.FIGMA_FILE_ID) || process.env.FIGMA_FILE_ID || '';
    // const api = new Figma.Api({
    //   personalAccessToken
    // });
    // const file = await api.getFile(fileId);
    // fsWriteFilePromise('figmaFile.json', JSON.stringify(file, null, 2));

    // eslint-disable-next-line new-cap
    const ajv = new Ajv.default({
      removeAdditional: true,
      validateSchema: true,
      schemaId: '$id',
      allErrors: true,
      strictTuples: false,
    });

    const figmaTokensSchema = JSON.parse(
      await fsReadFilePromise(
        `${callingPath}/figma-tokens.schema.json`,
        'utf-8'
      )
    ) as JSONSchema7;
    const figmaTokensJson = JSON.parse(
      await fsReadFilePromise(`${callingPath}/figmaFile.json`, 'utf-8')
    );

    const validate = ajv.compile(figmaTokensSchema);
    const valid = validate(figmaTokensJson);
    if (!valid) {
      logger.error(
        `Invalid JSON in sync to figma task:\n${JSON.stringify(
          validate.errors,
          null,
          2
        )}`
      );
      shell.exit(1);
    }

    const dereffed = await $RefParser.dereference(figmaTokensSchema);
    const merged = mergeAllOf(dereffed);
    inlineDefinitions([figmaTokensSchema]);
    delete merged.definitions;

    const types = await compile(merged as JSONSchema4, 'FigmaTokensSchema');
    await fsWriteFilePromise('figma-file.d.ts', types);

    // objectTraverse(
    //   figmaTokensJson as KickstartDSFigmaTokenStructure,
    //   ({ key, value, meta }) => {
    //     console.log(meta.nodePath);
    //   }
    // );

    await fsWriteFilePromise(
      'figma-tokens.schema.dereffed.json',
      JSON.stringify(merged, null, 2)
    );

    // TODO fix, readd this one:
    const parsedTokens: KickstartDSFigmaTokenStructure = {};
    // const parsedTokens: any = {};
    traverse(merged, {
      cb: (
        schema,
        pointer,
        _rootSchema,
        parentPointer,
        _parentKeyword,
        parentSchema
      ) => {
        const objectPointer = pointer
          .replaceAll('/properties', '')
          .replaceAll('/items', '');

        if (objectPointer.endsWith('/additionalItems') && parentPointer) {
          const objectParentPointer =
            parentPointer
              .replaceAll('/properties', '')
              .replaceAll('/items', '') || '';

          if (parentSchema) {
            const array = jsonPointer.get(figmaTokensJson, objectParentPointer);
            const difference = parentSchema.items.length - array.length;
            if (difference < 0) {
              const additionalItems: JSONSchema7[] = array.slice(difference);
              additionalItems.forEach((additionalItem, index) => {
                traverse(parentSchema.additionalItems, {
                  cb: (additionalSchema, additionalPointer) => {
                    if (
                      !additionalSchema.properties &&
                      !additionalSchema.items
                    ) {
                      const additionalObjectPointer = additionalPointer
                        .replaceAll('/properties', '')
                        .replaceAll('/items', '');
                      const value = jsonPointer.get(
                        additionalItem,
                        additionalObjectPointer
                      );
                      jsonPointer.set(
                        parsedTokens,
                        `${objectParentPointer}/${
                          array.length + difference + index
                        }${additionalObjectPointer}`,
                        value
                      );
                    }
                  },
                });
              });
            }
          }
        } else if (
          objectPointer &&
          !objectPointer.includes('/additionalItems/')
        ) {
          if (!schema.properties && !schema.items) {
            const value = jsonPointer.get(figmaTokensJson, objectPointer);
            jsonPointer.set(parsedTokens, objectPointer, value);
          }
        }
      },
    });

    await fsWriteFilePromise(
      'parsed-tokens.json',
      JSON.stringify(parsedTokens, null, 2)
    );
  };

  const getDefaultStyleDictionary = (
    callingPath: string,
    sourceDir: string
  ): StyleDictionary.Core =>
    StyleDictionary.extend(config).extend({
      source: [
        `${sourceDir}/*.json`,
        path.join(
          packagePath('@kickstartds/core', callingPath),
          'source/design-tokens/icons/*.svg'
        ),
        path.join(callingPath, 'static/icons/*.svg'),
      ],
      platforms: {
        jsx: {
          buildPath: '.storybook/',
        },
        storybook: {
          buildPath: '.storybook/',
        },
      },
    });

  const getStyleDictionary = async (
    callingPath: string,
    sourceDir: string,
    sdConfigPath?: string
  ): Promise<StyleDictionary.Core> => {
    if (!sdConfigPath) {
      return getDefaultStyleDictionary(callingPath, sourceDir);
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-dynamic-require
    const sdConfig = require(`${sdConfigPath}`);

    return StyleDictionary.extend(sdConfig);
  };

  return {
    helper: {
      generateFromPrimitivesJson,
      generateFromPrimitivesPath,
      compileTokens,
      syncToFigma,
      getDefaultStyleDictionary,
      getStyleDictionary,
    },
  };
};
