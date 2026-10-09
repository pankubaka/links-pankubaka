// Zwraca najnowszy film (bez shortsów) z kanału YouTube: { id, title, published }
// Odpowiedź jest cache'owana na Vercelu przez 30 min, więc YouTube dostaje max. ~2 zapytania na godzinę.

const HANDLE = process.env.YT_HANDLE || 'PanKuBaka';
const CHANNEL_ID = process.env.YT_CHANNEL_ID || 'UCbBtqOHYVBFe4VbAHTtwEqg';
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; pankubaka-links/1.0)', 'accept-language': 'pl,en;q=0.8' };

async function feed(channelId) {
  const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { headers: UA });
  if (!r.ok) return null;
  const xml = await r.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: (e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/) || [])[1],
    title: decode((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''),
    published: (e.match(/<published>([^<]+)<\/published>/) || [])[1],
  })).filter(v => v.id);
}

// Zapasowo: ID kanału z jego strony (gdyby stałe ID było złe albo się zmieniło)
async function channelIdFromHandle() {
  const r = await fetch(`https://www.youtube.com/@${HANDLE}`, { headers: UA });
  if (!r.ok) return null;
  const html = await r.text();
  const m = html.match(/"(?:externalId|channelId)":"(UC[\w-]{22})"/) || html.match(/channel\/(UC[\w-]{22})/);
  return m ? m[1] : null;
}

// Shorts: /shorts/ID odpowiada 200, zwykły film przekierowuje na /watch
async function isShort(id) {
  try {
    const r = await fetch(`https://www.youtube.com/shorts/${id}`, { method: 'HEAD', redirect: 'manual', headers: UA });
    return r.status === 200;
  } catch { return false; }
}

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

export default async function handler(req, res) {
  try {
    let videos = await feed(CHANNEL_ID);
    if (!videos || !videos.length) {
      const id = await channelIdFromHandle();
      videos = id ? await feed(id) : null;
    }
    if (!videos || !videos.length) throw new Error('Brak filmów w feedzie');

    let pick = videos[0];
    for (const v of videos.slice(0, 6)) {
      if (!(await isShort(v.id))) { pick = v; break; }
    }
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    res.status(200).json(pick);
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(502).json({ error: String(e.message || e) });
  }
}
