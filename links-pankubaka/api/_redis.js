// Minimalny klient Upstash Redis (REST) — bez zależności.
// Vercel → Storage / Marketplace → Upstash Redis ustawia KV_REST_API_URL i KV_REST_API_TOKEN
// (albo UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const redisReady = () => Boolean(URL_ && TOKEN);

export async function pipeline(commands) {
  const r = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`Redis ${r.status}`);
  return (await r.json()).map(x => x.result);
}

// Data w strefie Europe/Warsaw, format YYYY-MM-DD
export function day(d = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(d);
}
