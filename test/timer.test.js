import test from 'node:test';
import assert from 'node:assert/strict';
import {elapsedMs,earned,duration,readState,startFromElapsed,pauseSession,resumeSession,stopSession} from '../docs/timer.js';
test('pause freezes earnings across reload and resume excludes every break',()=>{
  const start=1700000000000;let session={start,rate:3600,end:null};
  pauseSession(session,start+10000);pauseSession(session,start+20000);
  session=readState(JSON.stringify({session,history:[]})).session;
  assert.equal(elapsedMs(session,start+60000),10000);assert.equal(earned(session,start+60000),10);
  resumeSession(session,start+60000);resumeSession(session,start+70000);
  assert.equal(elapsedMs(session,start+65000),15000);
  pauseSession(session,start+70000);resumeSession(session,start+100000);
  assert.equal(elapsedMs(session,start+110000),30000);assert.equal(session.start,start);
  stopSession(session,start+110000);assert.equal(earned(session,start+999999),30);
});
test('stopping while paused preserves total and records the actual stop time',()=>{
  const start=1700000000000;const session={start,rate:3600,end:null};
  pauseSession(session,start+15000);stopSession(session,start+80000);
  assert.equal(session.end,start+80000);assert.equal(session.pausedAt,null);
  assert.equal(elapsedMs(session,start+90000),15000);
  const restored=readState(JSON.stringify({session,history:[session]}));assert.equal(earned(restored.history[0]),15);
});
test('invalid pause state is discarded without losing valid legacy sessions',()=>{
  const session={start:1700000000000,rate:1000,end:null};
  for(const fields of [{pausedMs:-1},{pausedMs:'5'},{pausedAt:0},{pausedAt:1700000001000,end:1700000002000}]) assert.equal(readState(JSON.stringify({session:{...session,...fields}})).session,null);
  assert.deepEqual(readState(JSON.stringify({session})).session,session);
});
test('elapsed input backdates the session to hours, minutes and seconds',()=>{const now=1700000000000;const start=startFromElapsed('6','42','15',now);const session={start,rate:1000,end:null};assert.equal(duration(elapsedMs(session,now)),'06:42:15');assert.equal(earned(session,now),6704.166666666667);assert.equal(duration(elapsedMs({start:startFromElapsed(30,0,0,now),rate:1,end:null},now)),'30:00:00');assert.equal(elapsedMs(readState(JSON.stringify({session,history:[]})).session,now+5000),24140000);});
test('elapsed input rejects invalid units and impossible dates',()=>{for(const parts of [[-1,0,0],[0,60,0],[0,0,60],[1.5,0,0],['abc',0,0],[Number.MAX_SAFE_INTEGER,0,0]])assert.ok(Number.isNaN(startFromElapsed(...parts,1700000000000)));assert.equal(startFromElapsed(0,0,0,1700000000000),1700000000000);});
test('restored running session includes time while tab was closed',()=>{const start=1700000000000;const saved=JSON.stringify({rate:1200,session:{start,rate:1200,end:null},history:[]});const restored=readState(saved);assert.equal(elapsedMs(restored.session,start+7200000),7200000);assert.equal(earned(restored.session,start+7200000),2400);});
test('stopped earnings stay fixed and hours may exceed 24',()=>{const s={start:1700000000000,rate:1000,end:1700003600000};assert.equal(earned(s,s.end+86400000),1000);assert.equal(duration(90061000),'25:01:01');});
test('custom start calculates backdated earnings and protects clock rollback',()=>{const s={start:1700000000000,rate:900,end:null};assert.equal(earned(s,s.start+1800000),450);assert.equal(earned(s,s.start-1000),0);});
test('corrupt storage recovers safely',()=>{assert.equal(readState('{oops').session,null);assert.equal(readState(JSON.stringify({rate:-2,session:{start:10,rate:0,end:null},history:[{},null]})).history.length,0);assert.equal(readState(null).rate,1000);});
