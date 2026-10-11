export const STORAGE_KEY = 'cashclock.v1';
export function elapsedMs(session, now = Date.now()) { return session ? Math.max(0, (session.end ?? now) - session.start) : 0; }
export function earned(session, now = Date.now()) { return session ? elapsedMs(session, now) * session.rate / 3600000 : 0; }
export function duration(ms) { const s = Math.floor(ms / 1000); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':'); }
export function validSession(s) { return !!s && Number.isFinite(s.start) && s.start > 0 && Number.isFinite(s.rate) && s.rate > 0 && s.rate <= 100000000 && (s.end === null || (Number.isFinite(s.end) && s.end >= s.start)); }
export function readState(raw) { try { const s = JSON.parse(raw); return { rate: Number.isFinite(s?.rate) && s.rate > 0 && s.rate <= 100000000 ? s.rate : 1000, session: validSession(s?.session) ? s.session : null, history: Array.isArray(s?.history) ? s.history.filter(x => validSession(x) && x.end !== null).slice(0, 50) : [] }; } catch { return {rate:1000,session:null,history:[]}; } }
