import { STORAGE_KEY, elapsedMs, earned, duration, readState, startFromElapsed, pauseSession, resumeSession, stopSession } from './timer.js';
const $ = id => document.getElementById(id);
let storageAvailable = true;
let state;
try { state = readState(localStorage.getItem(STORAGE_KEY)); } catch { state = readState(null); storageAvailable = false; }
const moneyFormat = new Intl.NumberFormat('en-US', {minimumFractionDigits:2,maximumFractionDigits:2});
const rubles = n => moneyFormat.format(n) + ' ₽';
const localInput = time => { const d=new Date(time); return new Date(time-d.getTimezoneOffset()*60000).toISOString().slice(0,19); };
const dateFormat = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'});
const timeFormat = new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'});
function message(text='') { $('message').textContent=text; $('message').hidden=!text; }
function save() { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); storageAvailable=true; } catch { storageAvailable=false; message('Browser storage is unavailable. Keep this tab open to retain your session.'); } renderStorage(); }
function renderStorage(){ $('save-note').textContent=storageAvailable?'Saved on this device':'Storage unavailable'; }
function draw(){ const s=state.session; const parts=moneyFormat.format(earned(s)).split('.'); $('money').replaceChildren(document.createTextNode(parts[0])); const dec=document.createElement('span');dec.className='decimal';dec.textContent='.'+parts[1];$('money').append(dec); $('elapsed').textContent=duration(elapsedMs(s)); }
function renderHistory(){ const history=$('history');history.replaceChildren();$('history-count').textContent=state.history.length;$('clear-history').hidden=!state.history.length;
  if(!state.history.length){history.innerHTML='<div class="empty-history">No sessions yet</div>';return;}
  for(const s of state.history){const row=document.createElement('div');row.className='history-row'; const left=document.createElement('div');const day=document.createElement('div');day.className='history-date';day.textContent=dateFormat.format(s.start)+', '+timeFormat.format(s.start)+' – '+timeFormat.format(s.end);const detail=document.createElement('div');detail.className='history-detail';detail.textContent=rubles(s.rate)+' / hour';left.append(day,detail);const right=document.createElement('div');const amount=document.createElement('div');amount.className='history-amount';amount.textContent=rubles(earned(s));const dur=document.createElement('div');dur.className='history-duration';dur.textContent=duration(elapsedMs(s));right.append(amount,dur);row.append(left,right);history.append(row);}
}
function render(){
  const s=state.session;const active=!!s&&s.end===null;const paused=active&&s.pausedAt!=null;const running=active&&!paused;
  $('rate').value=active?s.rate:state.rate;$('rate').disabled=active;$('rate-note').hidden=!active;
  $('start-mode').disabled=active;$('start-mode').hidden=active;
  $('custom-start').hidden=active||$('start-mode').value!=='custom';$('start-duration').hidden=active||$('start-mode').value!=='elapsed';$('edit-start').hidden=!active;
  $('toggle').classList.toggle('stop',running);$('button-text').textContent=running?'Pause':paused?'Resume':'Start';
  $('button-icon').innerHTML=running?'<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>':'<path d="M8 5v14l12-7z"/>';
  $('stop-session').hidden=!active;$('status').classList.toggle('running',running);
  $('status').innerHTML='<span></span>'+(paused?'Paused':running?'Running':s?'Stopped':'Idle');
  $('session-start').textContent=active?'Started '+dateFormat.format(s.start)+' at '+timeFormat.format(s.start):'';
  $('start-note').hidden=!active;$('start-note').textContent=active?dateFormat.format(s.start)+' · '+timeFormat.format(s.start):'';
  renderStorage();renderHistory();draw();
}
$('rate').addEventListener('change',()=>{const v=Number($('rate').value);if(!Number.isFinite(v)||v<=0||v>100000000){message('Enter an hourly rate between 0.01 and 100,000,000 ₽.');return;}state.rate=v;message();save();});
$('start-mode').addEventListener('change',()=>{$('custom-start').hidden=$('start-mode').value!=='custom';$('start-duration').hidden=$('start-mode').value!=='elapsed';if(!$('custom-start').value)$('custom-start').value=localInput(Date.now());$('custom-start').max=localInput(Date.now());});
$('toggle').addEventListener('click',()=>{
  message();const now=Date.now();
  if(state.session?.end===null){
    if(state.session.pausedAt!=null)resumeSession(state.session,now);else pauseSession(state.session,now);
  }else{
    const rate=Number($('rate').value);
    if(!Number.isFinite(rate)||rate<=0||rate>100000000){message('Enter a valid hourly rate before starting.');$('rate').focus();return;}
    const start=$('start-mode').value==='custom'?new Date($('custom-start').value).getTime():$('start-mode').value==='elapsed'?readElapsed('start',now):now;
    if(!Number.isFinite(start)||start<=0||start>now){message($('start-mode').value==='elapsed'?'Enter whole hours, minutes, and seconds. Minutes and seconds must be 0–59.':'Choose a start date and time in the past, or start now.');($('start-mode').value==='elapsed'?$('start-hours'):$('custom-start')).focus();return;}
    state.rate=rate;state.session={start,rate,end:null,pausedAt:null,pausedMs:0};
  }
  save();render();
});
$('stop-session').addEventListener('click',()=>{
  if(state.session?.end!==null)return;
  message();stopSession(state.session);state.history.unshift({...state.session});state.history=state.history.slice(0,50);save();render();
});
function readElapsed(prefix, now) { return startFromElapsed($(prefix+'-hours').value,$(prefix+'-minutes').value,$(prefix+'-seconds').value,now); }
function renderAdjustMode() { const elapsed=$('adjust-mode').value==='elapsed';$('adjust-duration').hidden=!elapsed;$('adjust-start').hidden=elapsed;$('adjust-start').disabled=elapsed; for(const unit of ['hours','minutes','seconds']) $('adjust-'+unit).disabled=!elapsed; }
$('adjust-mode').addEventListener('change',renderAdjustMode);
$('edit-start').addEventListener('click',()=>{const seconds=Math.floor(elapsedMs(state.session)/1000);$('adjust-hours').value=Math.floor(seconds/3600);$('adjust-minutes').value=Math.floor(seconds/60)%60;$('adjust-seconds').value=seconds%60;$('adjust-mode').value='elapsed';renderAdjustMode();$('adjust-start').value=localInput(state.session.start);$('adjust-start').max=localInput(state.session.pausedAt??Date.now());$('dialog-error').textContent='';$('start-dialog').showModal();});
$('start-form').addEventListener('submit',e=>{if(e.submitter?.value!=='apply')return;if(!state.session||state.session.end!==null){e.preventDefault();$('start-dialog').close();return;}const now=state.session.pausedAt??Date.now();const elapsedMode=$('adjust-mode').value==='elapsed';const start=elapsedMode?readElapsed('adjust',now)-(state.session.pausedMs??0):new Date($('adjust-start').value).getTime();if(!Number.isFinite(start)||start<=0||start>now){e.preventDefault();$('dialog-error').textContent=$('adjust-mode').value==='elapsed'?'Enter whole hours, minutes, and seconds. Minutes and seconds must be 0–59.':'Choose a valid time before the session’s current endpoint.';return;}state.session.start=start;save();render();});
$('clear-history').addEventListener('click',()=>{if(confirm('Clear your finished sessions? Your current session will be kept.')){state.history=[];save();renderHistory();}});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){state=readState(e.newValue);if($('start-dialog').open)$('start-dialog').close();render();}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)draw();});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.repeat&&!$('start-dialog').open&&e.target===document.body){e.preventDefault();$('toggle').click();}});
const today=new Date();$('today').textContent=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric'}).format(today);const weekday=document.createElement('strong');weekday.textContent=new Intl.DateTimeFormat('en-GB',{weekday:'long'}).format(today);$('today').prepend(weekday);
render();if(!storageAvailable)message('Browser storage is unavailable. Keep this tab open to retain your session.');setInterval(draw,100);
