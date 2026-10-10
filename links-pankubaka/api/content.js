import crypto from 'node:crypto';
import { pipeline, redisReady } from './_redis.js';

// GET  /api/content            → aktualna treść strony (publiczne)
// GET  /api/content?history=1  → ostatnie zapisy (panel, wymaga hasła)
// PUT  /api/content            → zapis z panelu (wymaga hasła)
// POST /api/content?restore=N  → przywrócenie wersji N z historii (wymaga hasła)

const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const authed = req => process.env.ADMIN_PASSWORD && same(req.headers['x-admin-key'] || '', process.env.ADMIN_PASSWORD);

const str = (v, max) => String(v ?? '').trim().slice(0, max);
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const okUrl = u => u === '#' || /^https?:\/\/[^\s"'<>]+$/i.test(u);
const BADGES = new Set(['new', 'aff']);

// Czyści i sprawdza treść z panelu. Zwraca [treść, błąd].
export function clean(input) {
  if (!input || !Array.isArray(input.sections)) return [null, 'Brak sekcji'];
  if (input.sections.length > 12) return [null, 'Maksymalnie 12 zakładek'];
  const ids = new Set(), sections = [];
  for (const s of input.sections) {
    const label = str(s.label, 30);
    if (!label) return [null, 'Każda zakładka musi mieć nazwę'];
    const id = slug(s.id || label).slice(0, 30) || 'sekcja';
    if (ids.has(id)) return [null, `Dwie zakładki mają ten sam identyfikator: ${id}`];
    ids.add(id);
    const items = [];
    if (!Array.isArray(s.items) || s.items.length > 60) return [null, `Za dużo linków w zakładce ${label}`];
    for (const it of s.items) {
      const t = str(it.t, 80);
      if (!t) return [null, `Link bez tytułu w zakładce ${label}`];
      const url = str(it.url, 500) || '#';
      if (!okUrl(url)) return [null, `Zły adres przy „${t}”. Musi zaczynać się od https://`];
      const yt = str(it.yt, 200);
      if (yt && !okUrl(yt)) return [null, `Zły link YouTube przy „${t}”`];
      const c = /^#[0-9a-f]{6}$/i.test(it.c) ? it.c : '#3a3358';
      const badge = Array.isArray(it.badge) && BADGES.has(it.badge[0]) && str(it.badge[1], 16) ? [it.badge[0], str(it.badge[1], 16)] : undefined;
      const lid = str(it.id, 80);
      items.push(Object.fromEntries(Object.entries({
        id: /^[a-z0-9:_-]{1,80}$/.test(lid) ? lid : `${id}:${slug(t)}`.slice(0, 80),
        t, s: str(it.s, 160), url, ico: str(it.ico, 3) || '•', c, badge,
        code: str(it.code, 30) || undefined, yt: yt || undefined,
        autoVideo: it.autoVideo ? true : undefined, hidden: it.hidden ? true : undefined,
        img: (() => { const v = str(it.img, 500); return v && (okUrl(v) && v !== '#' || /^\/api\/yt-avatar\?handle=[\w.-]+$/.test(v)) ? v : undefined; })(),
        noAvatar: it.noAvatar ? true : undefined,
      }).filter(([, v]) => v !== undefined)));
    }
    sections.push({ id, label, note: str(s.note, 300) || undefined, items });
  }
  const out = { bio: str(input.bio, 300), sections, savedAt: new Date().toISOString() };
  if (JSON.stringify(out).length > 60000) return [null, 'Treść jest za duża'];
  return [out, null];
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!redisReady()) {
    if (req.method === 'GET' && !req.query.history) return res.status(204).end();
    return res.status(500).json({ error: 'Baza Upstash Redis nie jest podłączona' });
  }

  if (req.method === 'GET' && !req.query.history) {
    const [raw] = await pipeline([['GET', 'content']]);
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=30');
    if (!raw) return res.status(204).end();
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.status(200).send(raw);
  }

  if (!authed(req)) return res.status(401).json({ error: 'Złe hasło' });

  if (req.method === 'GET') {
    const [list] = await pipeline([['LRANGE', 'content:history', 0, 9]]);
    return res.status(200).json({ history: (list || []).map((r, i) => { try { const j = JSON.parse(r); return { n: i, savedAt: j.savedAt, links: j.sections.reduce((a, s) => a + s.items.length, 0) }; } catch { return null; } }).filter(Boolean) });
  }

  if (req.method === 'POST' && req.query.restore !== undefined) {
    const n = Math.max(0, Math.min(9, parseInt(req.query.restore, 10) || 0));
    const [raw] = await pipeline([['LINDEX', 'content:history', n]]);
    if (!raw) return res.status(404).json({ error: 'Nie ma takiej wersji' });
    const [cur] = await pipeline([['GET', 'content']]);
    const restored = { ...JSON.parse(raw), savedAt: new Date().toISOString() };
    const cmds = [['SET', 'content', JSON.stringify(restored)]];
    if (cur) cmds.push(['LPUSH', 'content:history', cur], ['LTRIM', 'content:history', 0, 9]);
    await pipeline(cmds);
    return res.status(200).json(restored);
  }

  if (req.method === 'PUT') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
    const [data, err] = clean(body);
    if (err) return res.status(400).json({ error: err });
    const [cur] = await pipeline([['GET', 'content']]);
    const cmds = [['SET', 'content', JSON.stringify(data)]];
    if (cur) cmds.push(['LPUSH', 'content:history', cur], ['LTRIM', 'content:history', 0, 9]);
    await pipeline(cmds);
    return res.status(200).json(data);
  }

  res.status(405).end();
}
