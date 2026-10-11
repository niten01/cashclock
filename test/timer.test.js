import test from 'node:test';
import assert from 'node:assert/strict';
import {elapsedMs,earned,duration,readState} from '../docs/timer.js';
test('restored running session includes time while tab was closed',()=>{const start=1700000000000;const saved=JSON.stringify({rate:1200,session:{start,rate:1200,end:null},history:[]});const restored=readState(saved);assert.equal(elapsedMs(restored.session,start+7200000),7200000);assert.equal(earned(restored.session,start+7200000),2400);});
test('stopped earnings stay fixed and hours may exceed 24',()=>{const s={start:1700000000000,rate:1000,end:1700003600000};assert.equal(earned(s,s.end+86400000),1000);assert.equal(duration(90061000),'25:01:01');});
test('custom start calculates backdated earnings and protects clock rollback',()=>{const s={start:1700000000000,rate:900,end:null};assert.equal(earned(s,s.start+1800000),450);assert.equal(earned(s,s.start-1000),0);});
test('corrupt storage recovers safely',()=>{assert.equal(readState('{oops').session,null);assert.equal(readState(JSON.stringify({rate:-2,session:{start:10,rate:0,end:null},history:[{},null]})).history.length,0);assert.equal(readState(null).rate,1000);});
