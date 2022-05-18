import winston from 'winston';
import traverse from 'json-schema-traverse';
import chalkTemplate from 'chalk-template';
import inquirer, { DistinctQuestion, Answers, QuestionAnswer } from 'inquirer';
import { CosmiconfigResult } from 'cosmiconfig/dist/types.js';
import { Observable, Subscriber } from 'rxjs';
import { JSONSchema7 } from 'json-schema';
import { cosmiconfigSync } from 'cosmiconfig';
import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { getLogger } from './logging.js';

const schemaRcRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const loadedPrompts: DistinctQuestion[] = [];
const answers: Record<string, string> = {};

let rcConfig: CosmiconfigResult;
let rcSchema: JSONSchema7;
let logger: winston.Logger;
let promptName: string;
let preloadRc = false;

const getRcValue = (property: JSONSchema7): string | false => {
  if (property.$id && rcConfig) {
    const segments = property.$id.split('properties') || [];
    segments.shift();

    let rcValue;
    const shiftedSegment = segments.shift();
    if (shiftedSegment) {
      rcValue = rcConfig.config[shiftedSegment.replace(/\//g, '')];
    }

    while (segments.length > 0) {
      const shiftedSubSegment = segments.shift();
      if (shiftedSubSegment) {
        rcValue = rcValue[shiftedSubSegment.replace(/\//g, '')];
      }
    }
    return rcValue;
  }
  return false;
};

const makePrompt = (
  property: JSONSchema7 & {
    question: string;
    rcConfig: CosmiconfigResult;
    items?: {
      enum: string[];
    };
  }
): DistinctQuestion => {
  // TODO handle empty string
  const name = property.$id
    ? property.$id
        .replace(/properties\//g, '')
        .replace(/\//g, '.')
        .replace(/#\./, '')
    : '';

  const rcDefaultValue = preloadRc ? getRcValue(property) : '';

  switch (property.type) {
    case 'boolean':
      return {
        type: 'confirm',
        name,
        message: `${property.question}?`,
        default: rcDefaultValue || property.default
      };

    case 'array':
      return {
        type: 'checkbox',
        name,
        message: `${property.question}?`,
        choices: property.items ? property.items.enum : ['error'],
        default: rcDefaultValue || property.default
      };

    default:
      return {
        type: 'input',
        name,
        message: `${property.question}?`,
        default: rcDefaultValue || property.default,
        validate: (input: string) =>
          new RegExp(property.pattern || '').test(input) ||
          chalkTemplate`Invalid value for {bold ${name}}!`
      };
  }
};

const makePrompts = (schema: JSONSchema7) => {
  traverse(schema, {
    cb: (subSchema) => {
      if (subSchema.properties) {
        Object.keys(subSchema.properties).forEach((property) => {
          const propertySchema = subSchema.properties[property];

          if (propertySchema.type !== 'object' && propertySchema.question) {
            loadedPrompts.push(makePrompt(propertySchema));
          }
        });
      }
    }
  });
};

let emitter: Subscriber<DistinctQuestion<Answers>>;

const prompts = new Observable<DistinctQuestion<Answers>>((e) => {
  emitter = e;
  // need to start with at least one question here
  emitter.next({
    type: 'confirm',
    name: 'loadconfig',
    message: `Pre-load .${promptName}rc values for extension migration?`,
    default: true
  });
});

const onAnswer = (response: QuestionAnswer) => {
  if (response.name === 'loadconfig') {
    preloadRc = response.answer;

    if (preloadRc) {
      rcConfig = cosmiconfigSync(promptName).search();
    }

    makePrompts(rcSchema);
  } else {
    answers[response.name] = response.answer;
  }

  if (loadedPrompts.length === 0) {
    emitter.complete();
  } else {
    emitter.next(loadedPrompts.shift());
  }
};

const onError = () => logger.error('there was an error inquiring');

const setSegments = (
  segments: string[],
  value: unknown,
  result: Record<string, unknown>
): Record<string, unknown> => {
  const currentSegment = segments.shift() || '';

  if (segments.length > 0) {
    if (!result[currentSegment]) {
      result[currentSegment] = {};
    }

    result[currentSegment] = setSegments(
      segments,
      value,
      result[currentSegment] as Record<string, unknown>
    );
  } else {
    result[currentSegment] = value;
  }

  return result;
};

const convertToSchemaStructure = (
  answersGiven: Answers
): Record<string, unknown> => {
  let result = {};

  Object.keys(answersGiven).forEach((key) => {
    const segments = key.split('.');
    const value = answersGiven[key];

    result = setSegments(segments, value, result);
  });

  return result;
};

const prompt = async (
  moduleName: string,
  commandName: string
): Promise<Record<string, unknown>> => {
  logger = getLogger(moduleName).child({
    command: commandName,
    subcommand: 'prompt'
  });

  promptName = `${moduleName}-${commandName}`;
  rcSchema = JSON.parse(
    readFileSync(`${schemaRcRoot}/.${promptName}rc.schema.json`).toString()
  );

  return new Promise((resolve) => {
    inquirer.prompt(prompts).ui.process.subscribe(onAnswer, onError, () => {
      logger.info(
        chalkTemplate`finished: prompt for {bold ${moduleName}-${commandName}} configuration`
      );
      resolve(convertToSchemaStructure(answers));
    });
  });
};

export default prompt;
