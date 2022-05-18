import winston from 'winston';
import StyleDictionary from 'style-dictionary';
import path from 'path';
import tokens from '@kickstartds/core/design-tokens/index.js';
import chalkTemplate from 'chalk-template';
import { capitalCase } from 'change-case';
import { readFile, writeFile } from 'fs';
import { promisify } from 'util';
import {
  TokenInterface,
  TokensType,
  MeasurementValue,
  BorderValue,
  OpacityValue,
  ColorValue,
  DurationValue
} from '@specifyapp/parsers/types';
import promiseHelper from './promise.js';

const { config, writeTokens } = tokens;

const fsReadFilePromise = promisify(readFile);
const fsWriteFilePromise = promisify(writeFile);

export default (logger: winston.Logger): TokensUtil => {
  const subCmdLogger = logger.child({ utility: true });
  const {
    helper: { forEach }
  } = promiseHelper(logger);

  const generateTokens = (
    tokensJson: Record<string, unknown>,
    targetDir: string
  ): void => {
    writeTokens(tokensJson, targetDir);
  };

  const ksDSTokenTemplate = {
    'background-color': {},
    'text-color': {},
    color: {},
    spacing: {},
    border: {
      'border-width': {},
      'border-radius': {
        control: {
          value: '2px',
          token: {
            category: 'Border Radius',
            presenter: 'BorderRadius'
          }
        },
        card: {
          value: '2px',
          token: {
            category: 'Border Radius',
            presenter: 'BorderRadius'
          }
        },
        surface: {
          value: '4px',
          token: {
            category: 'Border Radius',
            presenter: 'BorderRadius'
          }
        },
        pill: {
          value: '999px',
          token: {
            category: 'Border Radius',
            presenter: 'BorderRadius'
          }
        },
        circle: {
          value: '50%',
          token: {
            category: 'Border Radius',
            presenter: 'BorderRadius'
          }
        }
      }
    },
    'box-shadow': {},
    transition: {
      // 'timing-function': {
      //   bounce: {
      //     value: "cubic-bezier(0.17,1,0.5,1.5)"
      //   },
      //   'ease-out': {
      //     value: "ease-out"
      //   },
      //   'ease-in': {
      //     value: "ease-in"
      //   },
      //   'ease-in-out': {
      //     value: "ease-in-out"
      //   },
      //   linear: {
      //     value: "linear"
      //   }
      // },
      // transition: {
      //   collapse: {
      //     value: "{ks.duration.slow} {ks.timing-function.ease-out}"
      //   },
      //   hover: {
      //     value: "{ks.duration.fast} {ks.timing-function.ease-in-out}"
      //   },
      //   fade: {
      //     value: "{ks.duration.slow} {ks.timing-function.ease-out}"
      //   }
      // }
    },
    breakpoint: {
      phone: {
        value: '36em',
        private: true
      },
      tablet: {
        value: '48em',
        private: true
      },
      laptop: {
        value: '62em',
        private: true
      },
      desktop: {
        value: '75em',
        private: true
      }
    }
  };

  const generateFromSpecify = async (
    specifyRawTokens: TokenInterface[],
    targetDir: string
  ): Promise<void> => {
    const output = specifyRawTokens.reduce<typeof StyleDictionaryObject>(
      (map, token) => {
        switch (token.type as TokensType) {
          case 'color': {
            const [
              colorCategory,
              colorName,
              colorVariantBase,
              colorVariantVariation
            ] = token.name.split('/');

            switch (colorCategory) {
              case 'scale': {
                map.color[colorName] = map.color[colorName] || {};

                if (colorVariantBase === 'default') {
                  map.color[colorName]._ = {
                    value: token.value,
                    attributes: {
                      category: 'color'
                    },
                    token: {
                      category: `Colors: ${capitalCase(
                        colorName.replace('-', ' ')
                      )}`,
                      presenter: 'Color'
                    }
                  };
                } else if (colorVariantVariation) {
                  map.color[colorName][colorVariantBase] =
                    map.color[colorName][colorVariantBase] || {};
                  map.color[colorName][colorVariantBase][
                    colorVariantVariation
                  ] = {
                    value: token.value,
                    attributes: {
                      category: 'color'
                    },
                    token: {
                      category: `Colors: ${capitalCase(
                        colorName.replace('-', ' ')
                      )} ${capitalCase(colorVariantBase)} Scale`,
                      presenter: 'Color'
                    }
                  };
                } else {
                  map.color[colorName][colorVariantBase] =
                    map.color[colorName][colorVariantBase] || {};
                  map.color[colorName][colorVariantBase]._ = {
                    value: token.value,
                    attributes: {
                      category: 'color'
                    },
                    token: {
                      category: `Colors: ${capitalCase(
                        colorName.replace('-', ' ')
                      )} ${capitalCase(colorVariantBase)} Scale`,
                      presenter: 'Color'
                    }
                  };
                }

                break;
              }
              case 'shadow': {
                map['box-shadow'].color = map['box-shadow'].color || {};
                const shadowTypes = specifyRawTokens
                  .filter(
                    (shadowToken) =>
                      shadowToken.type === 'shadow' &&
                      shadowToken.name !== 'opacity' &&
                      shadowToken.name !== 'color' &&
                      !shadowToken.name.includes('-')
                  )
                  .map(
                    (shadowToken) => shadowToken.name.split('/').pop() as string
                  );

                shadowTypes.forEach((shadowType) => {
                  map['box-shadow'].color[shadowType] =
                    map['box-shadow'].color[shadowType] || {};
                  map['box-shadow'].color[shadowType][
                    colorName === 'default' ? '_' : colorName
                  ] = {
                    value: `rgba(${(token.value as ColorValue).r},${
                      (token.value as ColorValue).g
                    },${
                      (token.value as ColorValue).b
                    },{ks.box-shadow.opacity.${shadowType}.${
                      colorName === 'default' ? '_' : colorName
                    }})`
                  };
                });

                break;
              }
              case 'background-color': {
                map[colorCategory][colorName] =
                  map[colorCategory][colorName] || {};

                if (!colorVariantBase) {
                  map[colorCategory][colorName] = {
                    _: {
                      value: token.value,
                      attributes: {
                        category: 'color'
                      },
                      token: {
                        category: `Colors: Background ${capitalCase(
                          colorName.replace('-', ' ')
                        )}`,
                        presenter: 'Color'
                      }
                    }
                  };
                } else if (colorVariantBase === 'default') {
                  // TODO re-check this, not explicitly defined in our SD format right now... so drop it
                  // map[colorCategory][colorName]['_'] = {
                  //   value: token.value,
                  //   attributes: {
                  //     category: "color"
                  //   },
                  //   token: {
                  //     category: `Colors: Background ${capitalCase(colorName.replace('-', ' '))}`,
                  //     presenter: "Color"
                  //   }
                  // };
                } else if (colorVariantBase.includes('-')) {
                  const [base, variation] = colorVariantBase.split('-');

                  map[colorCategory][colorName][base] =
                    map[colorCategory][colorName][base] || {};
                  map[colorCategory][colorName][base][variation] = {
                    value: token.value,
                    attributes: {
                      category: 'color'
                    },
                    token: {
                      category: `Colors: Background ${capitalCase(
                        colorName.replace('-', ' ')
                      )}`,
                      presenter: 'Color'
                    }
                  };
                } else {
                  map[colorCategory][colorName][colorVariantBase] =
                    map[colorCategory][colorName][colorVariantBase] || {};
                  map[colorCategory][colorName][colorVariantBase]._ = {
                    value: token.value,
                    attributes: {
                      category: 'color'
                    },
                    token: {
                      category: `Colors: Background ${capitalCase(
                        colorName.replace('-', ' ')
                      )}`,
                      presenter: 'Color'
                    }
                  };
                }

                break;
              }
              case 'text-color': {
                map[colorCategory][colorName] =
                  map[colorCategory][colorName] || {};

                if (colorVariantBase === 'default') {
                  map[colorCategory][colorName]._ = {
                    value: token.value,
                    attributes: {
                      category: 'color'
                    },
                    token: {
                      category: 'Colors: Text Default',
                      presenter: 'Color'
                    }
                  };
                } else if (colorVariantBase.includes('-')) {
                  const [base, variation] = colorVariantBase.split('-');

                  map[colorCategory][colorName][base] =
                    map[colorCategory][colorName][base] || {};
                  map[colorCategory][colorName][base][variation] = {
                    value: token.value,
                    attributes: {
                      category: 'color'
                    },
                    token: {
                      category: `Colors: Text ${capitalCase(
                        colorName.replace('-', ' ')
                      )}`,
                      presenter: 'Color'
                    }
                  };
                } else {
                  map[colorCategory][colorName][colorVariantBase] =
                    map[colorCategory][colorName][colorVariantBase] || {};
                  map[colorCategory][colorName][colorVariantBase]._ = {
                    value: token.value,
                    attributes: {
                      category: 'color'
                    },
                    token: {
                      category: `Colors: Text ${capitalCase(
                        colorName.replace('-', ' ')
                      )}`,
                      presenter: 'Color'
                    }
                  };
                }
                break;
              }
              default:
                break;
            }
            break;
          }
          case 'measurement': {
            const splitName = token.name.split('-');
            const measurementName =
              splitName.length === 4
                ? `${splitName[1]}-${splitName[2]}`
                : splitName[1];
            const measurementVariant =
              splitName.length === 4 ? splitName[3] : splitName[2];

            if (measurementVariant === 'base') {
              map.spacing[measurementName] = {
                _: {
                  value: `{ks.spacing.${measurementName}.base}`,
                  token: {
                    category: 'Spacing',
                    presenter: 'Spacing'
                  }
                },
                base: {
                  value: (
                    (token.value as MeasurementValue).measure / 16
                  ).toString(),
                  attributes: {
                    category: 'size'
                  }
                },
                'bp-factor': {
                  phone: {
                    value: '1.25'
                  },
                  tablet: {
                    value: '1.5625'
                  },
                  laptop: {
                    value: '1.9531'
                  },
                  desktop: {
                    value: '2.4414'
                  }
                }
              };
            } else {
              // TODO don't short-circuit this, need to read value from token, and match from base scale for reference
              // now just stupidly chooses `measurementVariant` statically, which means those values are not actually adjustable
              // map['spacing'][measurementName] = map['spacing'][measurementName] || {};
              // map['spacing'][measurementName][measurementVariant] = map['spacing'][measurementName][measurementVariant] || {};
              // map['spacing'][measurementName][measurementVariant] = measurementVariant.includes('-')
              //   ? { value: `{ks.spacing.${measurementVariant}._}` }
              //   : { value: `{ks.spacing.${measurementVariant}._} {ks.spacing.${measurementVariant}._}` };
            }
            break;
          }
          case 'border': {
            // TODO do more with borders here, there are more values to potentially map... like the border color
            const [, , borderName] = token.name.split('-');

            map.border['border-width'][borderName] =
              map.border['border-width'][borderName] || {};
            map.border['border-width'][borderName] = {
              value: `${(token.value as BorderValue).width.value.measure}${
                (token.value as BorderValue).width.value.unit
              }`
            };
            break;
          }
          case 'shadow': {
            if (token.name.includes('border-width')) {
              // TODO maybe those can be re-used / integrated, too
            } else {
              const [shadowName, shadowVariant] = token.name
                .split('/')[1]
                .split('-');
              map['box-shadow'][shadowName] =
                map['box-shadow'][shadowName] || {};

              if (shadowVariant) {
                map['box-shadow'][shadowName][shadowVariant] = {
                  value: `0 1px 2.75px {ks.box-shadow.color.${shadowName}.${shadowVariant}}`
                };
              } else {
                map['box-shadow'][shadowName]._ = {
                  value: `0 1px 5.5px {ks.box-shadow.color.${shadowName}._}`,
                  token: { category: 'Box Shadow', presenter: 'Shadow' }
                };
              }
            }
            break;
          }
          case 'opacity': {
            if (token.name.includes('box-shadow')) {
              const [, , opacityName, opacityVariant] = token.name.split('-');

              map['box-shadow'].opacity = map['box-shadow'].opacity || {};
              map['box-shadow'].opacity[opacityName] =
                map['box-shadow'].opacity[opacityName] || {};

              if (opacityVariant) {
                map['box-shadow'].opacity[opacityName][opacityVariant] = {
                  value: (
                    (token.value as OpacityValue).opacity / 100
                  ).toString()
                };
              } else {
                map['box-shadow'].opacity[opacityName]._ = {
                  value: (
                    (token.value as OpacityValue).opacity / 100
                  ).toString()
                };
              }
            }
            break;
          }
          case 'duration': {
            const [, durationName] = token.name.split('-');

            // TODO solve this by naming convention, to get to the basic scale more intelligently
            const durationBaseScale = ['immediate', 'fast', 'medium', 'slow'];
            if (durationBaseScale.includes(durationName)) {
              map.transition.duration = map.transition.duration || {};
              map.transition.duration[durationName] = {
                value: `${(token.value as DurationValue).duration}${
                  (token.value as DurationValue).unit
                }`
              };
            }
            break;
          }
          case 'textStyle':
            break;
          default:
            break;
        }

        return map;
      },
      ksDSTokenTemplate
    );

    forEach(Object.keys(output), async (category) => {
      const fileJson: typeof StyleDictionaryObject = { ks: {} };

      if (category === 'border') {
        fileJson.ks = output[category];
        await fsWriteFilePromise(
          `${targetDir}/${category}.json`,
          JSON.stringify(fileJson, null, 2)
        );
      } else if (category === 'transition') {
        fileJson.ks.duration = output[category];
        await fsWriteFilePromise(
          `${targetDir}/${category}.json`,
          JSON.stringify(fileJson, null, 2)
        );
      } else {
        fileJson.ks[category] = output[category];
        await fsWriteFilePromise(
          `${targetDir}/${category}.json`,
          JSON.stringify(fileJson, null, 2)
        );
      }
    });
  };

  const generateFromSpecifyJson = async (
    specifyRawTokens: TokenInterface[],
    targetDir = 'tokens'
  ): Promise<void> => {
    subCmdLogger.info(
      chalkTemplate`generating your token set from passed {bold Specify} values`
    );

    generateFromSpecify(specifyRawTokens, targetDir);

    subCmdLogger.info(
      chalkTemplate`successfully generated tokens and wrote them to folder {bold ${targetDir}}`
    );
  };

  const generateFromSpecifyPath = async (
    specifyTokensPath: string,
    targetDir = 'tokens'
  ): Promise<void> => {
    subCmdLogger.info(
      chalkTemplate`generating your token set from file {bold ${specifyTokensPath}}`
    );

    const tokensJson = JSON.parse(
      await fsReadFilePromise(specifyTokensPath, 'utf8')
    );
    generateFromSpecify(tokensJson, targetDir);

    subCmdLogger.info(
      chalkTemplate`successfully generated tokens and wrote them to folder {bold ${targetDir}}`
    );
  };

  const generateFromJson = async (
    tokensJson: Record<string, unknown>,
    targetDir = 'tokens'
  ): Promise<void> => {
    subCmdLogger.info(
      chalkTemplate`generating your token set from passed values`
    );

    generateTokens(tokensJson, targetDir);

    subCmdLogger.info(
      chalkTemplate`successfully generated tokens and wrote them to folder {bold ${targetDir}}`
    );
  };

  const generateFromPath = async (
    primitivesPath: string,
    targetDir = 'tokens'
  ): Promise<void> => {
    subCmdLogger.info(
      chalkTemplate`generating your token set from file {bold ${primitivesPath}}`
    );

    const tokensJson = JSON.parse(
      await fsReadFilePromise(primitivesPath, 'utf8')
    );
    generateTokens(tokensJson, targetDir);

    subCmdLogger.info(
      chalkTemplate`successfully generated tokens and wrote them to folder {bold ${targetDir}}`
    );
  };

  const compileTokens = (styleDictionary: StyleDictionary.Core): void => {
    styleDictionary
      .buildPlatform('css')
      .buildPlatform('jsx')
      .buildPlatform('storybook');
  };

  const getStyleDictionary = (): StyleDictionary.Core =>
    StyleDictionary.extend(config).extend({
      source: [
        'tokens/*.json',
        path.join(
          __dirname,
          '../node_modules/@kickstartds/core/source/design-tokens/icons/*.svg'
        ),
        path.join(__dirname, '../static/icons/*.svg')
      ],
      platforms: {
        jsx: {
          buildPath: '.storybook/'
        },
        storybook: {
          buildPath: '.storybook/'
        }
      }
    });

  return {
    helper: {
      generateFromJson,
      generateFromPath,
      generateFromSpecifyJson,
      generateFromSpecifyPath,
      compileTokens,
      getStyleDictionary
    }
  };
};
