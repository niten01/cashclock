export const STORAGE_KEY = 'cashclock.v1';
export function startFromElapsed(hours, minutes, seconds, now = Date.now()) {
  const parts = [hours, minutes, seconds].map(Number);
  if (parts.some(v => !Number.isSafeInteger(v) || v < 0) || parts[1] > 59 || parts[2] > 59) return NaN;
  const start = now - (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  return Number.isFinite(start) && start > 0 ? start : NaN;
}
export function elapsedMs(session, now = Date.now()) { return session ? Math.max(0, (session.end ?? session.pausedAt ?? now) - session.start - (session.pausedMs ?? 0)) : 0; }
export function pauseSession(session, now = Date.now()) {
  if (session.end === null && session.pausedAt == null) session.pausedAt = Math.max(now, session.start);
}
export function resumeSession(session, now = Date.now()) {
  if (session.end === null && session.pausedAt != null) {
    session.pausedMs = (session.pausedMs ?? 0) + Math.max(0, now - session.pausedAt);
    session.pausedAt = null;
  }
}
export function stopSession(session, now = Date.now()) {
  if (session.end !== null) return;
  const end = Math.max(now, session.start, session.pausedAt ?? 0);
  resumeSession(session, end);
  session.end = end;
}
export function earned(session, now = Date.now()) { return session ? elapsedMs(session, now) * session.rate / 3600000 : 0; }
export function duration(ms) { const s = Math.floor(ms / 1000); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':'); }
export function validSession(s) { return !!s && Number.isFinite(s.start) && s.start > 0 && Number.isFinite(s.rate) && s.rate > 0 && s.rate <= 100000000 && (s.end === null || (Number.isFinite(s.end) && s.end >= s.start)) && (s.pausedMs === undefined || (Number.isFinite(s.pausedMs) && s.pausedMs >= 0)) && (s.pausedAt == null || (s.end === null && Number.isFinite(s.pausedAt) && s.pausedAt >= s.start)); }
export function readState(raw) { try { const s = JSON.parse(raw); return { rate: Number.isFinite(s?.rate) && s.rate > 0 && s.rate <= 100000000 ? s.rate : 1000, session: validSession(s?.session) ? s.session : null, history: Array.isArray(s?.history) ? s.history.filter(x => validSession(x) && x.end !== null).slice(0, 50) : [] }; } catch { return {rate:1000,session:null,history:[]}; } }
