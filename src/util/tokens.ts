import winston from 'winston';
import StyleDictionary from 'style-dictionary';
import path from 'path';
import shell from 'shelljs';
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
    },
    deprecated: {
      color: {
        black: {
          _: {
            value: {
              r: 78,
              g: 83,
              b: 86,
              a: 1
            },
            attributes: {
              category: 'color',
              deprecated: true
            }
          },
          alpha: {
            '1': {
              value: {
                r: 78,
                g: 83,
                b: 86,
                a: 0.1
              },
              attributes: {
                category: 'color',
                deprecated: true
              }
            },
            '2': {
              value: {
                r: 78,
                g: 83,
                b: 86,
                a: 0.2
              },
              attributes: {
                category: 'color',
                deprecated: true
              }
            },
            '3': {
              value: {
                r: 78,
                g: 83,
                b: 86,
                a: 0.3
              },
              attributes: {
                category: 'color',
                deprecated: true
              }
            },
            '5': {
              value: {
                r: 78,
                g: 83,
                b: 86,
                a: 0.5
              },
              attributes: {
                category: 'color',
                deprecated: true
              }
            },
            '7': {
              value: {
                r: 78,
                g: 83,
                b: 86,
                a: 0.7
              },
              attributes: {
                category: 'color',
                deprecated: true
              }
            }
          }
        },
        white: {
          _: {
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
          alpha: {
            '1': {
              value: {
                r: 255,
                g: 255,
                b: 255,
                a: 0.1
              },
              attributes: {
                category: 'color',
                deprecated: true
              }
            }
          }
        },
        grey: {
          '1': {
            value: {
              r: 237,
              g: 238,
              b: 238,
              a: 1
            },
            attributes: {
              category: 'color',
              deprecated: true
            }
          },
          '2': {
            value: {
              r: 220,
              g: 221,
              b: 221,
              a: 1
            },
            attributes: {
              category: 'color',
              deprecated: true
            }
          },
          '3': {
            value: {
              r: 202,
              g: 203,
              b: 204,
              a: 1
            },
            attributes: {
              category: 'color',
              deprecated: true
            }
          },
          '7': {
            value: {
              r: 131,
              g: 135,
              b: 137,
              a: 1
            },
            attributes: {
              category: 'color',
              deprecated: true
            }
          },
          '9': {
            value: {
              r: 96,
              g: 100,
              b: 103,
              a: 1
            },
            attributes: {
              category: 'color',
              deprecated: true
            }
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
      }
    },
    typo: {
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
    }
  };

  const generateFromSpecify = async (
    specifyRawTokens: TokenInterface[],
    targetDir: string
  ): Promise<void> => {
    shell.mkdir('-p', targetDir);

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
            const splitName = token.name
              .replace('stetch', 'stretch')
              .split('-');
            if (splitName.length !== 4) {
              const measurementName =
                splitName.length === 5
                  ? `${splitName[1]}-${splitName[2]}`
                  : splitName[1];
              const measurementVariant =
                splitName.length === 5
                  ? `${splitName[3]}-${splitName[4]}`
                  : splitName[2];

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
                const cleanedMeasurementVariant = measurementVariant.includes(
                  '-'
                )
                  ? (measurementVariant.split('-').shift() as string)
                  : measurementVariant;
                map.spacing[measurementName] =
                  map.spacing[measurementName] || {};
                map.spacing[measurementName][cleanedMeasurementVariant] =
                  map.spacing[measurementName][cleanedMeasurementVariant] || {};
                map.spacing[measurementName][cleanedMeasurementVariant] =
                  measurementVariant.includes('-')
                    ? {
                        value: `{ks.spacing.${cleanedMeasurementVariant
                          .split('-')
                          .shift()}._} {ks.spacing.${cleanedMeasurementVariant
                          .split('-')
                          .shift()}._}`
                      }
                    : { value: `{ks.spacing.${measurementVariant}._}` };
              }
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

    await forEach(Object.keys(output), async (category) => {
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
      } else if (category === 'breakpoint') {
        fileJson.ks.breakpoint = output[category];
        await fsWriteFilePromise(
          `${targetDir}/${category}s.json`,
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

    const result = generateFromSpecify(specifyRawTokens, targetDir);

    subCmdLogger.info(
      chalkTemplate`successfully generated tokens and wrote them to folder {bold ${targetDir}}`
    );

    return result;
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
    const result = generateFromSpecify(tokensJson, targetDir);

    subCmdLogger.info(
      chalkTemplate`successfully generated tokens and wrote them to folder {bold ${targetDir}}`
    );

    return result;
  };

  const generateTokens = async (
    tokensJson: Record<string, unknown>,
    targetDir: string
  ): Promise<void> => {
    shell.mkdir('-p', targetDir);
    return writeTokens(tokensJson, targetDir);
  };

  const generateFromPrimitivesJson = async (
    tokensJson: Record<string, unknown>,
    targetDir = 'tokens'
  ): Promise<void> => {
    subCmdLogger.info(
      chalkTemplate`generating your token set from passed values`
    );

    const result = generateTokens(tokensJson, targetDir);

    subCmdLogger.info(
      chalkTemplate`successfully generated tokens and wrote them to folder {bold ${targetDir}}`
    );

    return result;
  };

  const generateFromPrimitivesPath = async (
    primitivesPath: string,
    targetDir = 'tokens'
  ): Promise<void> => {
    subCmdLogger.info(
      chalkTemplate`generating your token set from file {bold ${primitivesPath}}`
    );

    const tokensJson = JSON.parse(
      await fsReadFilePromise(primitivesPath, 'utf8')
    );
    const result = generateTokens(tokensJson, targetDir);

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
