
import { randomScrambleForEvent } from 'cubing/scramble';
const start = Date.now();
const alg = await randomScrambleForEvent('333');
console.log('scramble:', alg.toString());
console.log('time:', Date.now() - start, 'ms');
