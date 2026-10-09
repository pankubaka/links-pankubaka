# PanKuBaka · linki

Strona z linkami + gra z 8-bitowym Kubą. Bez builda, gotowa pod Vercel.

## Pliki
- `index.html` – cała strona (treści linków: obiekt `SECTIONS` na początku skryptu)
- `avatar.jpg` – avatar i obrazek do podglądu linku (og:image)
- `api/latest-video.js` – zwraca najnowszy film z kanału PanKuBaka (bez shortsów), cache 30 min

## Wdrożenie
1. Wrzuć folder do nowego repo na GitHubie (albo `npx vercel` w tym folderze).
2. Vercel → Add New → Project → wybierz repo. Framework preset: **Other**, bez komendy build.
3. Settings → Domains → dodaj `links.pankubaka.pl`.
4. U operatora DNS dodaj rekord: `CNAME  links  →  cname.vercel-dns.com`.

## Edycja
- Linki, opisy, kody: `SECTIONS` w `index.html`.
- Film w „Najnowszy odcinek” ustawia się sam. Pole `yt` to zapas, gdyby API nie odpowiedziało.
- Inny kanał dla API: zmienne środowiskowe `YT_HANDLE` / `YT_CHANNEL_ID` w Vercelu.
- Test easter egga: dopisz `#meta` do adresu.
