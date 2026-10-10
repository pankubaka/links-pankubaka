// /api/yt-avatar?handle=PanKuBaka → przekierowanie na aktualny avatar kanału YouTube.
// Avatar jest brany ze strony kanału (og:image) i cache'owany na Vercelu przez dobę.
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; pankubaka-links/1.0)', 'accept-language': 'pl,en;q=0.8' };

export default async function handler(req, res) {
  const handle = String(req.query.handle || '');
  if (!/^[\w.-]{2,60}$/.test(handle)) return res.status(400).end();
  try {
    const r = await fetch(`https://www.youtube.com/@${handle}`, { headers: UA });
    if (!r.ok) throw new Error(String(r.status));
    const html = await r.text();
    const m = html.match(/<meta property="og:image" content="([^"]+)"/) ||
              html.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/);
    if (!m) throw new Error('brak avatara');
    let url = m[1].replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
    if (!/^https:\/\/yt\d?\.(ggpht|googleusercontent)\.com\//.test(url)) throw new Error('nieoczekiwany adres');
    url = url.replace(/=s\d+-/, '=s176-'); // wystarczająca rozdzielczość, mniejszy plik
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.writeHead(302, { Location: url });
    res.end();
  } catch {
    res.setHeader('Cache-Control', 's-maxage=600');
    res.status(404).end();
  }
}
