let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let d = {};
  try { d = JSON.parse(raw); } catch {}
  const parts = [`\x1b[36m${d.model?.display_name ?? '?'}\x1b[0m`];

  const cw = d.context_window ?? {};
  if (cw.used_percentage != null) {
    const pct = Math.round(cw.used_percentage);
    const filled = Math.min(10, Math.floor(pct / 10));
    const bar = '#'.repeat(filled) + '-'.repeat(10 - filled);
    let s = `ctx [${bar}] ${pct}%`;
    if (cw.total_input_tokens != null && cw.context_window_size != null) {
      s += ` ${Math.floor(cw.total_input_tokens / 1000)}k/${Math.floor(cw.context_window_size / 1000)}k`;
    }
    parts.push(s);
  }

  const rl = d.rate_limits ?? {};
  // resets_at is epoch seconds (ISO string tolerated)
  const toDate = (v) => {
    if (v == null) return null;
    const dt = typeof v === 'number' ? new Date(v < 1e12 ? v * 1000 : v) : new Date(v);
    return isNaN(dt) ? null : dt;
  };
  const p2 = (n) => String(n).padStart(2, '0');
  const hm = (dt) => `${p2(dt.getHours())}:${p2(dt.getMinutes())}`;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fmt = (w, label, long) => {
    if (w?.used_percentage == null) return null;
    let s = `${label}:${Math.round(w.used_percentage)}%`;
    const dt = toDate(w.resets_at);
    if (dt) s += ` (${long ? `${days[dt.getDay()]} ` : ''}${hm(dt)})`;
    return s;
  };
  const lim = [fmt(rl.five_hour, '5h', false), fmt(rl.seven_day, '7d', true)].filter(Boolean);
  if (lim.length) parts.push(lim.join(' '));

  process.stdout.write(parts.join(' | '));
});
