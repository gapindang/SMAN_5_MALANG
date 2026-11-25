import {hashPassword} from '../src/lib/security.mjs';
import {createInterface} from 'node:readline/promises';
const rl=createInterface({input:process.stdin,output:process.stdout});
const password=await rl.question('Password (visible in this local terminal): ');rl.close();
if(password.length<12)throw Error('Use at least 12 characters.');console.log(hashPassword(password));
