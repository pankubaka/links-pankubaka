# PanKuBaka · linki

Strona z linkami + gra z 8-bitowym Kubą. Bez builda, gotowa pod Vercel.

## Pliki
- `index.html` – cała strona (treści linków: obiekt `SECTIONS` na początku skryptu)
- `avatar.jpg` – avatar i obrazek do podglądu linku (og:image)
- `api/yt-avatar.js` – avatar kanału YouTube do ikon linków (cache 1 dzień)
- `api/latest-video.js` – zwraca najnowszy film z kanału PanKuBaka (bez shortsów), cache 30 min

## Wdrożenie
1. Wrzuć folder do nowego repo na GitHubie (albo `npx vercel` w tym folderze).
2. Vercel → Add New → Project → wybierz repo. Framework preset: **Other**, bez komendy build.
3. Settings → Domains → dodaj `links.pankubaka.pl`.
4. U operatora DNS dodaj rekord: `CNAME  links  →  cname.vercel-dns.com`.

## Statystyki i panel (/admin)
1. Vercel → projekt → **Storage** → Create / Marketplace → **Upstash Redis** (plan darmowy) → Connect do projektu.
   Vercel sam doda zmienne `KV_REST_API_URL` i `KV_REST_API_TOKEN`.
2. Settings → Environment Variables → dodaj `ADMIN_PASSWORD` (hasło do panelu) i `STATS_SALT` (dowolny losowy ciąg).
3. Redeploy. Panel: `links.pankubaka.pl/admin`.

Co jest liczone: odsłony, unikalni odwiedzający (dziennie), kliknięcia w każdy link, skopiowane kody, źródła wejść,
telefon/komputer, ukończone maratony w grze. Bez cookies; IP nie jest zapisywane (tylko skrót, który zmienia się codziennie).
Boty są odfiltrowywane. Dane trzymane ~13 miesięcy.
Źródła: dodawaj `?ref=instagram`, `?ref=youtube` itd. do linków w bio.

## Edycja linków w panelu
`/admin` → zakładka **Linki**: opis pod imieniem, zakładki (nazwa, dopisek, kolejność), linki (tytuł, opis, adres,
ikona, kolor, etykieta, kod rabatowy, film YouTube, „zawsze najnowszy film”, ukrycie), przenoszenie między zakładkami.
Zapis trafia do bazy i strona pokazuje go po kilku sekundach, bez nowego wdrożenia.
Panel trzyma 10 poprzednich wersji do przywrócenia.
Identyfikator linku do statystyk nadawany jest przy pierwszym zapisie i nie zmienia się po zmianie tytułu.

## Edycja (pliki)
- `links.js` to treść startowa: działa, dopóki nic nie zapiszesz w panelu (albo gdy baza nie odpowiada).
- Film w „Najnowszy odcinek” ustawia się sam. Pole `yt` to zapas, gdyby API nie odpowiedziało.
- Inny kanał dla API: zmienne środowiskowe `YT_HANDLE` / `YT_CHANNEL_ID` w Vercelu.
- Test easter egga: dopisz `#meta` do adresu.
