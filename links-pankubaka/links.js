/* ===== TREŚCI DOMYŚLNE =====
   Po wdrożeniu treść edytujesz w panelu /admin → Linki. Ten plik to tylko punkt startowy
   (używany, dopóki w panelu nic nie zapiszesz, albo gdy baza nie odpowiada). */
window.BIO = "Opowiem ci o grach Nintendo, pokażę druk 3D i jak (nie) biegać. Nagrywam content wideo i biegam od ponad 10 lat.";
window.SECTIONS = [
  { id:"sociale", label:"Sociale", items:[
    { t:"YouTube · PanKuBaka", s:"Główny kanał", url:"https://www.youtube.com/@PanKuBaka", ico:"YT", c:"#e0352b" },
    { t:"YouTube · Druga Strefa KuBaki", s:"Kanał o bieganiu, shorty, materiały bez zadęcia", url:"https://www.youtube.com/@DrugaStrefaKuBaki", ico:"YT", c:"#b3261e" },
    { t:"Instagram", s:"@pankubaka", url:"https://www.instagram.com/pankubaka/", ico:"IG", c:"#b2458f" },
    { t:"X", s:"@pankubaka", url:"https://x.com/pankubaka", ico:"X", c:"#25222e" },
    { t:"Twitch", s:"pankubaka", url:"https://www.twitch.tv/pankubaka", ico:"TW", c:"#7a4fd0" },
    { t:"Facebook", s:"PanKuBaka", url:"https://www.facebook.com/PanKuBaka/", ico:"FB", c:"#2f5fb3" },
  ]},
  { id:"polecane", label:"Polecane", items:[
    { t:"Najnowszy odcinek", s:"Wszystkie filmy na kanale PanKuBaka", autoVideo:true, yt:"https://www.youtube.com/watch?v=GS7T3Kq1npo", url:"https://www.youtube.com/@PanKuBaka/videos", ico:"▶", c:"#e0352b" },
    { t:"Zatrudnij mnie", s:"Wideo, reelsy, relacje z eventów, prowadzenie", url:"https://www.zatrudnij.pankubaka.pl", ico:"HI", c:"#3a7bd5", badge:["new","Oferta"] },
  ]},
  { id:"afiliacje", label:"Afiliacje",
    note:"Linki afiliacyjne: jeśli coś przez nie kupisz, mogę dostać prowizję. Cena dla Ciebie się nie zmienia.",
    items:[
    { t:"HOLY", s:"10% taniej z kodem KUBAKA", url:"https://pl.holy.com", ico:"HO", c:"#d4357a", badge:["aff","Kod"], code:"KUBAKA" },
    { t:"Prusa", s:"Drukarki 3D i filamenty", url:"https://www.prusa3d.com/pl/#a_aid=PanKubaka", ico:"3D", c:"#f26a1b", badge:["aff","Afiliacja"] },
  ]},
];


window.slug=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
window.linkId=(sec,it)=>it.id||sec.id+":"+window.slug(it.t);
window.SECTIONS.forEach(sec=>sec.items.forEach(it=>{it.id=window.linkId(sec,it)}));
