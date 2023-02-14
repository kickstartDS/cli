import omelette from 'omelette';

const completion = omelette('kickstartDS|ksDS').tree({
  example: ['demo'],
  tokens: ['init', 'compile', 'tofigma'],
  schema: ['dereference', 'types'],
  completions: ['install', 'remove'],
});

completion.init();

export default completion;
