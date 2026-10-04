/* ============================================================================
   EASTERN TIME — date-aware America/New_York wall-clock -> instant conversion.
   SHIPPED BYTE-IDENTICAL to the website (eastern-time.js) and to Cloud Functions (functions/eastern-time.js),
   so client and server always agree on when a dual locks. Replaces the fixed "-05:00" offset.

   easternToDate('2026-10-24', '19:00') -> 2026-10-24T23:00:00Z  (7:00 pm EDT)
   easternToDate('2026-11-07', '19:00') -> 2026-11-08T00:00:00Z  (7:00 pm EST)
   Repeated hour (Nov 1, 1:00-1:59 am occurs twice): the EARLIER instant (EDT) -- a dual never locks late.
   Skipped hour (spring, 2:00-2:59 am does not exist): the first valid instant after it.
   Returns null for malformed input.
   ============================================================================ */
(function (root) {
  const FMT = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function wallOf(ms) { const p = {}; FMT.formatToParts(new Date(ms)).forEach(x => { p[x.type] = x.value; }); if (p.hour === '24') p.hour = '00';
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`; }
  function easternToDate(ymd, hhmm) {
    const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '')), t = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
    if (!d || !t || +t[1] > 23 || +t[2] > 59) return null;
    const base = Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]); if (isNaN(base)) return null;
    const chk = new Date(base); if (chk.getUTCFullYear() !== +d[1] || chk.getUTCMonth() !== +d[2] - 1 || chk.getUTCDate() !== +d[3]) return null;   // reject impossible dates (no roll-over)
    const target = `${d[1]}-${d[2]}-${d[3]}T${String(+t[1]).padStart(2, '0')}:${t[2]}`;
    // Eastern is UTC-4 (EDT) or UTC-5 (EST): keep whichever candidate reads back as the requested wall clock; earliest wins.
    const hits = [4, 5].map(h => base + h * 3600000).filter(ms => wallOf(ms) === target).sort((a, b) => a - b);
    if (hits.length) return new Date(hits[0]);
    return new Date(base + 5 * 3600000);   // skipped hour (spring forward): first valid instant after the gap
  }
  const api = { easternToDate };
  root.EasternTime = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
