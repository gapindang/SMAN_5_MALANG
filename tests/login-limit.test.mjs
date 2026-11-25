import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLocalLoginLimiter} from '../src/lib/login-limit.mjs';
test('local login allows eight attempts then blocks until the window expires',()=>{
 const limit=createLocalLoginLimiter();
 for(let i=0;i<8;i++)assert.equal(limit('first',1000),true);
 assert.equal(limit('first',1001),false);
 assert.equal(limit('second',1001),true);
 assert.equal(limit('first',1000+15*60000),true);
});
