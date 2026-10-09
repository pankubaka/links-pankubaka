import crypto from 'node:crypto';
import { pipeline, redisReady, day } from './_redis.js';

const flat = a => { const o = {}; for (let i = 0; a && i < a.length; i += 2) o[a[i]] = Number(a[i + 1]); return o; };
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return res.status(500).json({ error: 'Brak zmiennej ADMIN_PASSWORD w Vercelu' });
  if (!same(req.headers['x-admin-key'] || '', pass)) return res.status(401).json({ error: 'Złe hasło' });
  if (!redisReady()) return res.status(500).json({ error: 'Baza Upstash Redis nie jest podłączona' });

  const n = Math.min(400, Math.max(1, parseInt(req.query.days, 10) || 30));
  const days = [];
  for (let i = n - 1; i >= 0; i--) days.push(day(new Date(Date.now() - i * 864e5)));
  const unique = [...new Set(days)];

  const cmds = unique.flatMap(d => [['HGETALL', `d:${d}`], ['PFCOUNT', `uv:${d}`], ['HGETALL', `ref:${d}`]]);
  const out = await pipeline(cmds);
  const rows = unique.map((d, i) => {
    const h = flat(out[i * 3]);
    const row = { day: d, views: h.views || 0, unique: Number(out[i * 3 + 1]) || 0, clicks: h.clicks || 0, copies: h.copies || 0, finish: h.finish || 0, links: {}, copy: {}, dev: {}, ref: flat(out[i * 3 + 2]) };
    for (const [f, v] of Object.entries(h)) {
      if (f.startsWith('click:')) row.links[f.slice(6)] = v;
      else if (f.startsWith('copy:')) row.copy[f.slice(5)] = v;
      else if (f.startsWith('dev:')) row.dev[f.slice(4)] = v;
    }
    return row;
  });
  res.status(200).json({ days: rows });
}
