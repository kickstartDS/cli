import omelette from 'omelette';

const completion = omelette('kickstartDS|ksDS').tree({
  example: ['demo', 'info'],
  tokens: ['init', 'build', 'convert']
});

completion.init();

export default completion;
