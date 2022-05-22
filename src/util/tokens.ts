import winston from 'winston';
import StyleDictionary from 'style-dictionary';
import path from 'path';
import shell from 'shelljs';
import tokens from '@kickstartds/core/design-tokens/index.js';
import chalkTemplate from 'chalk-template';
import { capitalCase } from 'change-case';
import { readFile, writeFile } from 'fs';
import { promisify } from 'util';
import { traverse } from 'object-traversal';
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
      'timing-function': {
        bounce: {
          value: 'cubic-bezier(0.17,1,0.5,1.5)'
        },
        'ease-out': {
          value: 'ease-out'
        },
        'ease-in': {
          value: 'ease-in'
        },
        'ease-in-out': {
          value: 'ease-in-out'
        },
        linear: {
          value: 'linear'
        }
      },
      transition: {
        collapse: {
          value: 'duration {ks.timing-function.ease-out}'
        },
        hover: {
          value: 'duration {ks.timing-function.ease-in-out}'
        },
        fade: {
          value: 'duration {ks.timing-function.ease-out}'
        }
      }
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
    },
    deprecated: {
      color: {
        white: {
          value: {
            r: 255,
            g: 255,
            b: 255,
            a: 1
          },
          attributes: {
            category: 'color',
            deprecated: true
          }
        },
        error: {
          value: {
            r: 230,
            g: 2,
            b: 1,
            a: 1
          },
          attributes: {
            category: 'color',
            deprecated: true
          }
        }
      },
      g: {
        'header-height': {
          value: '0px',
          attributes: {
            deprecated: true
          }
        },
        'scroll-offset': {
          value: '{g.header-height.value}',
          attributes: {
            deprecated: true
          }
        }
      }
    },
    typo: {
      'font-family': {
        display: {
          value: 'brando-sans',
          token: {
            category: 'Font Families',
            presenter: 'FontFamily'
          }
        },
        copy: {
          value: 'brando-sans',
          token: {
            category: 'Font Families',
            presenter: 'FontFamily'
          }
        },
        ui: {
          value: 'brando-sans',
          token: {
            category: 'Font Families',
            presenter: 'FontFamily'
          }
        },
        mono: {
          value: 'brando-sans',
          token: {
            category: 'Font Families',
            presenter: 'FontFamily'
          }
        }
      },
      'font-weight': {
        light: {
          value: 300,
          token: {
            category: 'Font Weights',
            presenter: 'FontWeight'
          }
        },
        regular: {
          value: 400,
          token: {
            category: 'Font Weights',
            presenter: 'FontWeight'
          }
        },
        'semi-bold': {
          value: 600,
          token: {
            category: 'Font Weights',
            presenter: 'FontWeight'
          }
        },
        bold: {
          value: 700,
          token: {
            category: 'Font Weights',
            presenter: 'FontWeight'
          }
        }
      },
      'font-size': {
        display: {
          'bp-factor': {
            phone: {
              value: 1.167
            },
            tablet: {
              value: 1.375
            }
          },
          'xxs-base': {
            value: '0.4064rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: display',
              presenter: 'FontSize'
            }
          },
          'xs-base': {
            value: '0.5487rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: display',
              presenter: 'FontSize'
            }
          },
          's-base': {
            value: '0.7407rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: display',
              presenter: 'FontSize'
            }
          },
          'm-base': {
            value: '1rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: display',
              presenter: 'FontSize'
            }
          },
          'l-base': {
            value: '1.35rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: display',
              presenter: 'FontSize'
            }
          },
          'xl-base': {
            value: '1.8225rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: display',
              presenter: 'FontSize'
            }
          },
          'xxl-base': {
            value: '2.4604rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: display',
              presenter: 'FontSize'
            }
          }
        },
        copy: {
          'bp-factor': {
            tablet: {
              value: 1.125
            }
          },
          'xxs-base': {
            value: '0.476rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: copy',
              presenter: 'FontSize'
            }
          },
          'xs-base': {
            value: '0.5831rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: copy',
              presenter: 'FontSize'
            }
          },
          's-base': {
            value: '0.7143rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: copy',
              presenter: 'FontSize'
            }
          },
          'm-base': {
            value: '0.875rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: copy',
              presenter: 'FontSize'
            }
          },
          'l-base': {
            value: '1.0719rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: copy',
              presenter: 'FontSize'
            }
          },
          'xl-base': {
            value: '1.313rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: copy',
              presenter: 'FontSize'
            }
          },
          'xxl-base': {
            value: '1.6085rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: copy',
              presenter: 'FontSize'
            }
          }
        },
        ui: {
          'bp-factor': {
            tablet: {
              value: 1.125
            }
          },
          'xxs-base': {
            value: '0.544rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: ui',
              presenter: 'FontSize'
            }
          },
          'xs-base': {
            value: '0.6664rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: ui',
              presenter: 'FontSize'
            }
          },
          's-base': {
            value: '0.8163rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: ui',
              presenter: 'FontSize'
            }
          },
          'm-base': {
            value: '1rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: ui',
              presenter: 'FontSize'
            }
          },
          'l-base': {
            value: '1.225rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: ui',
              presenter: 'FontSize'
            }
          },
          'xl-base': {
            value: '1.5006rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: ui',
              presenter: 'FontSize'
            }
          },
          'xxl-base': {
            value: '1.8383rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: ui',
              presenter: 'FontSize'
            }
          }
        },
        mono: {
          'bp-factor': {
            tablet: {
              value: 1.125
            }
          },
          'xxs-base': {
            value: '0.544rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: mono',
              presenter: 'FontSize'
            }
          },
          'xs-base': {
            value: '0.6664rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: mono',
              presenter: 'FontSize'
            }
          },
          's-base': {
            value: '0.8163rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: mono',
              presenter: 'FontSize'
            }
          },
          'm-base': {
            value: '1rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: mono',
              presenter: 'FontSize'
            }
          },
          'l-base': {
            value: '1.225rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: mono',
              presenter: 'FontSize'
            }
          },
          'xl-base': {
            value: '1.5006rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: mono',
              presenter: 'FontSize'
            }
          },
          'xxl-base': {
            value: '1.8383rem',
            attributes: {
              category: 'size'
            },
            token: {
              category: 'Font Sizes: mono',
              presenter: 'FontSize'
            }
          }
        }
      },
      'line-height': {
        display: {
          xxs: {
            value: 1.5
          },
          xs: {
            value: 1.5
          },
          s: {
            value: 1.5
          },
          m: {
            value: 1.5
          },
          l: {
            value: 1.5
          },
          xl: {
            value: 1.5
          },
          xxl: {
            value: 1.5
          }
        },
        copy: {
          xxs: {
            value: 1.75
          },
          xs: {
            value: 1.75
          },
          s: {
            value: 1.75
          },
          m: {
            value: 1.75
          },
          l: {
            value: 1.75
          },
          xl: {
            value: 1.75
          },
          xxl: {
            value: 1.75
          }
        },
        ui: {
          xxs: {
            value: 1.75
          },
          xs: {
            value: 1.75
          },
          s: {
            value: 1.75
          },
          m: {
            value: 1.75
          },
          l: {
            value: 1.75
          },
          xl: {
            value: 1.75
          },
          xxl: {
            value: 1.75
          }
        },
        mono: {
          xxs: {
            value: 1.75
          },
          xs: {
            value: 1.75
          },
          s: {
            value: 1.75
          },
          m: {
            value: 1.75
          },
          l: {
            value: 1.75
          },
          xl: {
            value: 1.75
          },
          xxl: {
            value: 1.75
          }
        }
      }
    }
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
      chalkTemplate`successfully generated {bold Specify} tokens and wrote them to folder {bold ${targetDir}}`
    );

    return result;
  };

  const generateFromSpecify = async (
    specifyTokenJson: TokenInterface[],
    initializedTokenJson: typeof StyleDictionaryObject,
    targetDir: string
  ): Promise<void> => {
    shell.mkdir('-p', targetDir);

    const baseScales = specifyTokenJson.reduce<typeof StyleDictionaryObject>(
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
                  map.color[colorName].base = {
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
                    base: {
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
                    }
                  };
                } else {
                  map.color[colorName][colorVariantBase] =
                    map.color[colorName][colorVariantBase] || {};
                  map.color[colorName][colorVariantBase].base = {
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
                const shadowTypes = specifyTokenJson
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
              default:
                break;
            }
            break;
          }
          case 'measurement': {
            // TODO ideally this wouldn't be needed, but Specify
            // passes all rectangles... and we use one as a divider
            if (token.name === 'Rectangle') {
              break;
            }

            if (token.name.endsWith('-base')) {
              const splitName = token.name.split('-');
              const measurementName = splitName[1];
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
                    value: '1.414'
                  },
                  tablet: {
                    value: '1.9994'
                  },
                  laptop: {
                    value: '2.8271'
                  },
                  desktop: {
                    value: '3.9976'
                  }
                }
              };
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
            if (token.name.startsWith('duration-base')) {
              const [, , durationName] = token.name.split('-');

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

    const styleDictionary = specifyTokenJson.reduce<
      typeof StyleDictionaryObject
    >((map, token) => {
      switch (token.type as TokensType) {
        case 'color': {
          const [colorCategory, colorName, colorVariantBase] =
            token.name.split('/');

          switch (colorCategory) {
            case 'background-color': {
              map[colorCategory][colorName] =
                map[colorCategory][colorName] || {};

              if (!colorVariantBase) {
                const splitRef = initializedTokenJson.ks[colorCategory][
                  colorName
                ].base.value
                  .replace('{', '')
                  .replace('}', '')
                  .split('.');

                const [, , refColorName] = splitRef;

                const referenceableTokens: string[] = [];
                if (refColorName.endsWith('-inverted')) {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                } else {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      !meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                }

                if (referenceableTokens.length < 2) {
                  map[colorCategory][colorName] = {
                    base: {
                      value:
                        referenceableTokens.length === 0
                          ? token.value
                          : referenceableTokens[0],
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
                } else {
                  // TODO handle this when it occurs
                  throw new Error(
                    'multiple tokens that could be referenced found, should be exactly 1'
                  );
                }
              } else if (colorVariantBase === 'default') {
                const splitRef = initializedTokenJson.ks[colorCategory][
                  colorName
                ].base.value
                  .replace('{', '')
                  .replace('}', '')
                  .split('.');

                const [, , refColorName] = splitRef;

                const referenceableTokens: string[] = [];
                if (refColorName.endsWith('-inverted')) {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                } else {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      !meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                }

                if (referenceableTokens.length < 2) {
                  map[colorCategory][colorName] = {
                    base: {
                      value:
                        referenceableTokens.length === 0
                          ? token.value
                          : referenceableTokens[0],
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
                } else {
                  // TODO handle this when it occurs
                  throw new Error(
                    'multiple tokens that could be referenced found, should be exactly 1'
                  );
                }
              } else if (colorVariantBase.includes('-')) {
                const [base, variation] = colorVariantBase.split('-');

                const splitRef = initializedTokenJson.ks[colorCategory][
                  colorName
                ][base][variation].base.value
                  .replace('{', '')
                  .replace('}', '')
                  .split('.');

                const [, , refColorName] = splitRef;

                const referenceableTokens: string[] = [];
                if (refColorName.endsWith('-inverted')) {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                } else {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      !meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                }

                if (referenceableTokens.length < 2) {
                  map[colorCategory][colorName][base] =
                    map[colorCategory][colorName][base] || {};
                  map[colorCategory][colorName][base][variation] = {
                    base: {
                      value:
                        referenceableTokens.length === 0
                          ? token.value
                          : referenceableTokens[0],
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
                } else {
                  // TODO handle this when it occurs
                  throw new Error(
                    'multiple tokens that could be referenced found, should be exactly 1'
                  );
                }
              } else {
                const splitRef = initializedTokenJson.ks[colorCategory][
                  colorName
                ][colorVariantBase].base.value
                  .replace('{', '')
                  .replace('}', '')
                  .split('.');

                const [, , refColorName] = splitRef;

                const referenceableTokens: string[] = [];
                if (refColorName.endsWith('-inverted')) {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                } else {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      !meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                }

                if (referenceableTokens.length < 2) {
                  map[colorCategory][colorName][colorVariantBase] =
                    map[colorCategory][colorName][colorVariantBase] || {};
                  map[colorCategory][colorName][colorVariantBase] = {
                    base: {
                      value:
                        referenceableTokens.length === 0
                          ? token.value
                          : referenceableTokens[0],
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
                } else {
                  // TODO handle this when it occurs
                  throw new Error(
                    'multiple tokens that could be referenced found, should be exactly 1'
                  );
                }
              }

              break;
            }
            case 'text-color': {
              map[colorCategory][colorName] =
                map[colorCategory][colorName] || {};

              if (colorVariantBase === 'default') {
                const splitRef = initializedTokenJson.ks[colorCategory][
                  colorName
                ].base.value
                  .replace('{', '')
                  .replace('}', '')
                  .split('.');

                const [, , refColorName] = splitRef;

                const referenceableTokens: string[] = [];
                if (refColorName && refColorName.endsWith('-inverted')) {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                } else if (refColorName) {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      !meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                }

                if (referenceableTokens.length < 2) {
                  map[colorCategory][colorName] = {
                    base: {
                      value:
                        referenceableTokens.length === 0
                          ? token.value
                          : referenceableTokens[0],
                      attributes: {
                        category: 'color'
                      },
                      token: {
                        category: 'Colors: Text Default',
                        presenter: 'Color'
                      }
                    }
                  };
                } else {
                  // TODO handle this when it occurs
                  throw new Error(
                    'multiple tokens that could be referenced found, should be exactly 1'
                  );
                }
              } else if (colorVariantBase.includes('-')) {
                const [base, variation] = colorVariantBase.split('-');

                const splitRef = initializedTokenJson.ks[colorCategory][
                  colorName
                ][base][variation].base.value
                  .replace('{', '')
                  .replace('}', '')
                  .split('.');

                const [, , refColorName] = splitRef;

                const referenceableTokens: string[] = [];
                if (refColorName && refColorName.endsWith('-inverted')) {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                } else if (refColorName) {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      !meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                }

                if (referenceableTokens.length < 2) {
                  map[colorCategory][colorName][base] =
                    map[colorCategory][colorName][base] || {};
                  map[colorCategory][colorName][base][variation] = {
                    base: {
                      value:
                        referenceableTokens.length === 0
                          ? token.value
                          : referenceableTokens[0],
                      attributes: {
                        category: 'color'
                      },
                      token: {
                        category: `Colors: Text ${capitalCase(
                          colorName.replace('-', ' ')
                        )}`,
                        presenter: 'Color'
                      }
                    }
                  };
                } else {
                  // TODO handle this when it occurs
                  throw new Error(
                    'multiple tokens that could be referenced found, should be exactly 1'
                  );
                }
              } else {
                const splitRef = initializedTokenJson.ks[colorCategory][
                  colorName
                ][colorVariantBase].base.value
                  .replace('{', '')
                  .replace('}', '')
                  .split('.');

                const [, , refColorName] = splitRef;

                const referenceableTokens: string[] = [];
                if (refColorName && refColorName.endsWith('-inverted')) {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                } else if (refColorName) {
                  traverse(map.color, ({ key, value, meta }) => {
                    if (
                      key === 'base' &&
                      value.value.r === (token.value as ColorValue).r &&
                      value.value.g === (token.value as ColorValue).g &&
                      value.value.b === (token.value as ColorValue).b &&
                      value.value.a === (token.value as ColorValue).a &&
                      !meta.nodePath?.includes('-inverted')
                    ) {
                      referenceableTokens.push(`{ks.color.${meta.nodePath}}`);
                    }
                  });
                }

                if (referenceableTokens.length < 2) {
                  map[colorCategory][colorName][colorVariantBase] =
                    map[colorCategory][colorName][colorVariantBase] || {};
                  map[colorCategory][colorName][colorVariantBase] = {
                    base: {
                      value:
                        referenceableTokens.length === 0
                          ? token.value
                          : referenceableTokens[0],
                      attributes: {
                        category: 'color'
                      },
                      token: {
                        category: `Colors: Text ${capitalCase(
                          colorName.replace('-', ' ')
                        )}`,
                        presenter: 'Color'
                      }
                    }
                  };
                } else {
                  // TODO handle this when it occurs
                  throw new Error(
                    'multiple tokens that could be referenced found, should be exactly 1'
                  );
                }
              }
              break;
            }
            default:
              break;
          }
          break;
        }
        case 'measurement': {
          // TODO ideally this wouldn't be needed, but Specify
          // passes all rectangles... and we use one as a divider
          if (token.name === 'Rectangle') {
            break;
          }

          const splitName = token.name.split('-');
          if (splitName.length !== 4 && !token.name.endsWith('-base')) {
            const measurementName =
              splitName.length === 5
                ? `${splitName[1]}-${splitName[2]}`
                : splitName[1];
            const measurementVariant =
              splitName.length === 5
                ? `${splitName[3]}-${splitName[4]}`
                : splitName[2];

            if (measurementVariant.includes('-')) {
              const [base, orientation] = measurementVariant.split('-');

              const referenceableTokens: string[] = [];
              traverse(map.spacing, ({ key, value, meta }) => {
                if (
                  key === 'base' &&
                  value.value ===
                    ((token.value as MeasurementValue).measure / 16).toString()
                ) {
                  referenceableTokens.push(`{ks.spacing.${meta.nodePath}}`);
                }
              });

              if (referenceableTokens.length < 2) {
                map.spacing[measurementName] =
                  map.spacing[measurementName] || {};
                map.spacing[measurementName][base] = map.spacing[
                  measurementName
                ][base] || {
                  value: `{ks.spacing.horizontal._} {ks.spacing.vertical._}`
                };
                const value =
                  referenceableTokens.length === 0
                    ? (
                        (token.value as MeasurementValue).measure / 16
                      ).toString()
                    : referenceableTokens[0].split('.')[2];

                if (orientation === 'h') {
                  const search =
                    referenceableTokens.length === 0
                      ? '{ks.spacing.horizontal._}'
                      : 'horizontal';

                  map.spacing[measurementName][base].value = map.spacing[
                    measurementName
                  ][base].value.replace(search, value);
                } else {
                  const search =
                    referenceableTokens.length === 0
                      ? '{ks.spacing.vertical._}'
                      : 'vertical';

                  map.spacing[measurementName][base].value = map.spacing[
                    measurementName
                  ][base].value.replace(search, value);
                }
              } else {
                // TODO handle this when it occurs
                throw new Error(
                  'multiple tokens that could be referenced found, should be exactly 1'
                );
              }
            } else {
              const referenceableTokens: string[] = [];
              traverse(map.spacing, ({ key, value, meta }) => {
                if (
                  key === 'base' &&
                  value.value ===
                    ((token.value as MeasurementValue).measure / 16).toString()
                ) {
                  referenceableTokens.push(`{ks.spacing.${meta.nodePath}}`);
                }
              });

              if (referenceableTokens.length < 2) {
                map.spacing[measurementName] =
                  map.spacing[measurementName] || {};
                map.spacing[measurementName][measurementVariant] =
                  map.spacing[measurementName][measurementVariant] || {};
                map.spacing[measurementName][measurementVariant] = {
                  value:
                    referenceableTokens.length === 0
                      ? token.value
                      : referenceableTokens[0]
                };
              } else {
                // TODO handle this when it occurs
                throw new Error(
                  'multiple tokens that could be referenced found, should be exactly 1'
                );
              }
            }
          }
          break;
        }
        case 'duration': {
          if (!token.name.startsWith('duration-base')) {
            const splitName = token.name.split('-');
            const [, durationName] = splitName;

            const referenceableTokens: string[] = [];
            traverse(map.transition.duration, ({ key, value, meta }) => {
              if (
                key === 'value' &&
                value ===
                  `${(token.value as DurationValue).duration}${
                    (token.value as DurationValue).unit
                  }`
              ) {
                referenceableTokens.push(
                  `{ks.duration.${meta.nodePath?.split('.').shift()}}`
                );
              }
            });

            if (referenceableTokens.length < 2) {
              map.transition.transition[durationName].value =
                map.transition.transition[durationName].value.replace(
                  'duration',
                  referenceableTokens.length === 0
                    ? `${(token.value as DurationValue).duration}${
                        (token.value as DurationValue).unit
                      }`
                    : referenceableTokens[0]
                );
            } else {
              // TODO handle this when it occurs
              throw new Error(
                'multiple tokens that could be referenced found, should be exactly 1'
              );
            }
          }
          break;
        }
        default:
          break;
      }

      return map;
    }, baseScales);

    await forEach(Object.keys(styleDictionary), async (category) => {
      const fileJson: typeof StyleDictionaryObject = { ks: {} };

      if (category === 'border') {
        fileJson.ks = styleDictionary[category];
        await fsWriteFilePromise(
          `${targetDir}/${category}.json`,
          JSON.stringify(fileJson, null, 2)
        );
      } else if (category === 'transition') {
        fileJson.ks.duration = styleDictionary[category].duration;
        fileJson.ks.transition = styleDictionary[category].transition;
        fileJson.ks['timing-function'] =
          styleDictionary[category]['timing-function'];
        await fsWriteFilePromise(
          `${targetDir}/${category}.json`,
          JSON.stringify(fileJson, null, 2)
        );
      } else if (category === 'typo') {
        fileJson.ks = styleDictionary[category];
        await fsWriteFilePromise(
          `${targetDir}/${category}.json`,
          JSON.stringify(fileJson, null, 2)
        );
      } else if (category === 'breakpoint') {
        fileJson.ks.breakpoint = styleDictionary[category];
        await fsWriteFilePromise(
          `${targetDir}/${category}s.json`,
          JSON.stringify(fileJson, null, 2)
        );
      } else if (category === 'deprecated') {
        delete fileJson.ks;
        Object.keys(styleDictionary[category]).forEach((deprecatedCategory) => {
          fileJson[deprecatedCategory] =
            styleDictionary[category][deprecatedCategory];
        });
        await fsWriteFilePromise(
          `${targetDir}/${category}.json`,
          JSON.stringify(fileJson, null, 2)
        );
      } else {
        fileJson.ks[category] = styleDictionary[category];
        await fsWriteFilePromise(
          `${targetDir}/${category}.json`,
          JSON.stringify(fileJson, null, 2)
        );
      }
    });
  };

  const generateFromSpecifyJson = async (
    specifyTokenJson: TokenInterface[],
    initializedTokenJson: typeof StyleDictionaryObject,
    targetDir = 'tokens'
  ): Promise<void> => {
    subCmdLogger.info(
      chalkTemplate`generating your token set from passed {bold Specify} values`
    );

    const result = generateFromSpecify(
      specifyTokenJson,
      initializedTokenJson,
      targetDir
    );

    subCmdLogger.info(
      chalkTemplate`successfully generated {bold primitives} tokens and wrote them to folder {bold ${targetDir}}`
    );

    return result;
  };

  const generateFromSpecifyPath = async (
    specifyTokenPath: string,
    primitiveTokenPath: string,
    targetDir = 'tokens'
  ): Promise<void> => {
    subCmdLogger.info(
      chalkTemplate`generating your token set from {bold Specify} tokens file {bold ${specifyTokenPath}}`
    );

    const specifyTokenJson = JSON.parse(
      await fsReadFilePromise(specifyTokenPath, 'utf8')
    );

    await generateFromPrimitivesPath(primitiveTokenPath, `${targetDir}-tmp`);

    const initializedTokenJson: typeof StyleDictionaryObject = { ks: {} };
    await forEach(Object.keys(ksDSTokenTemplate), async (category) => {
      const initialCategoryJson = JSON.parse(
        await fsReadFilePromise(
          `${targetDir}-tmp/${
            category === 'breakpoint' ? 'breakpoints' : category
          }.json`,
          'utf-8'
        )
      );

      if (category !== 'deprecated') {
        initializedTokenJson.ks[category] = initialCategoryJson.ks[category];
      }
    });

    const result = generateFromSpecify(
      specifyTokenJson,
      initializedTokenJson,
      targetDir
    );

    subCmdLogger.info(
      chalkTemplate`successfully generated tokens and wrote them to folder {bold ${targetDir}}`
    );

    return result;
  };

  const compileTokens = (styleDictionary: StyleDictionary.Core): void => {
    styleDictionary
      .buildPlatform('css')
      .buildPlatform('jsx')
      .buildPlatform('storybook');
  };

  const getStyleDictionary = (
    callingPath: string,
    sourceDir: string
  ): StyleDictionary.Core =>
    StyleDictionary.extend(config).extend({
      source: [
        `${sourceDir}/*.json`,
        path.join(
          callingPath,
          'node_modules/@kickstartds/core/source/design-tokens/icons/*.svg'
        ),
        path.join(callingPath, 'static/icons/*.svg')
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
      generateFromPrimitivesJson,
      generateFromPrimitivesPath,
      generateFromSpecifyJson,
      generateFromSpecifyPath,
      compileTokens,
      getStyleDictionary
    }
  };
};
