import crypto from 'node:crypto';
import { pipeline, redisReady, day } from './_redis.js';

const TYPES = new Set(['view', 'click', 'copy', 'finish']);
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|monitor/i;
const KEEP = 60 * 60 * 24 * 400; // dane trzymamy ~13 miesięcy

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (!redisReady()) return res.status(204).end();

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const ua = String(req.headers['user-agent'] || '');
  if (!TYPES.has(body.type) || BOT.test(ua)) return res.status(204).end();

  const id = typeof body.id === 'string' && /^[a-z0-9:_-]{1,80}$/.test(body.id) ? body.id : null;
  const d = day();
  const k = `d:${d}`;
  const cmds = [];

  if (body.type === 'view') {
    cmds.push(['HINCRBY', k, 'views', 1]);
    // unikalny odwiedzający: skrót z IP + przeglądarki + daty (nic nie zapisujemy wprost, nic nie ląduje w cookies)
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const h = crypto.createHash('sha256').update(`${ip}|${ua}|${d}|${process.env.STATS_SALT || 'pankubaka'}`).digest('hex').slice(0, 16);
    cmds.push(['PFADD', `uv:${d}`, h], ['EXPIRE', `uv:${d}`, KEEP]);
    const ref = String(body.ref || '').toLowerCase().replace(/^www\./, '').replace(/[^a-z0-9.\-_]/g, '').slice(0, 60) || 'bezpośrednio';
    cmds.push(['HINCRBY', `ref:${d}`, ref, 1], ['EXPIRE', `ref:${d}`, KEEP]);
    const dev = /mobile|android|iphone|ipad/i.test(ua) ? 'telefon' : 'komputer';
    cmds.push(['HINCRBY', k, `dev:${dev}`, 1]);
  } else if (body.type === 'finish') {
    cmds.push(['HINCRBY', k, 'finish', 1]);
  } else if (id) {
    cmds.push(['HINCRBY', k, body.type === 'click' ? 'clicks' : 'copies', 1]);
    cmds.push(['HINCRBY', k, `${body.type}:${id}`, 1]);
  }
  if (!cmds.length) return res.status(204).end();
  cmds.push(['EXPIRE', k, KEEP]);
  try { await pipeline(cmds); } catch {}
  res.status(204).end();
}
