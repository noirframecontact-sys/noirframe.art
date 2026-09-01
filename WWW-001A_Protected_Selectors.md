# WWW-001A — Protected Selectors

**Status:** 🔒 FROZEN — Geometry & layout contract  
**Projekt:** `noirframe.art`  
**Powiązane:** `WWW-002_Layout_Freeze.md`, `website/styles.css`

> 90% katastrof nie bierze się z tekstu.  
> Bierze się z `display:flex` zamienionego na `display:block`.

NFST i content **nie mogą** modyfikować reguł CSS dla selektorów poniżej bez osobnego epica layoutu i nowych snapshotów WWW-002.

---

## Zasada

| Dozwolone | Zakazane |
|-----------|----------|
| Zmiana treści wewnątrz panelu | Zmiana `display`, `position`, `flex`, `grid` na kontenerze |
| Wymiana zdjęć / tekstów P2/P3 | Zmiana `padding`, `margin`, `width`, `height` layoutu |
| — | Usuwanie / zmiana nazw klas chronionych |
| — | Nowe breakpointy bez WWW-002 |

---

## P0 — Shell & navigation

| Selektor | Rola | Nie ruszać |
|----------|------|------------|
| `#siteNav` | Główna nawigacja | `position`, `z-index`, ukrywanie poza hero |
| `.siteNav__bar` | Pasek menu | flex, wysokość |
| `.siteNav__panel` | Panel rozwijany | overlay, transform |
| `.siteNav__dropdown` | Portfolio dropdown | grid, animacja open |
| `.siteNav__toggle` | Menü | rozmiar hit-area |
| `.siteNav__link` | Linki sekcji | typografia nav |
| `.siteNav__dropdownItem` | Wedding / Portrait… | grid 2 kolumny |

---

## P0 — Menu / hero

| Selektor | Rola |
|----------|------|
| `.container` | Hero splash |
| `.heroStage` | Rama hero |
| `.heroPicture` / `.heroArt` | Obraz startowy |
| `.menuWrapper` | Ekran menu |
| `.menuHeroMachine` | Karuzela menu |
| `.menuHeroViewport` | Viewport karuzeli |
| `.menuHeroTrack` | Track przewijania |
| `.nfLogo` | Logo NF / NOIЯFRAME |
| `.menuIntro` | Księżyc Dark Side + logo |

---

## P1 — System chrome

| Selektor | Rola |
|----------|------|
| `.backToMenuButton` | BACK TO MENU — wszystkie ekrany |
| `.blogHeader` | Sticky header bloga |
| `.blogHeader__nav` | Górny BACK |
| `.blogHeader__title` | H1 BLOG |

---

## P1 — Sekcje treści (geometria, nie copy)

| Selektor | Ekran |
|----------|-------|
| `.gallery` | Bazowy layout subpage |
| `.gallery--contact` | Kontakt — warstwy tła |
| `.contactLayout` | Frame kontaktu |
| `.contactLayout__frame` | Obrys panelu |
| `.contactLayout__panel` | Panel danych |
| `.contactLayout__languages` | Blok języków |
| `.gallery--about` | About — tło + team |
| `.gallery--angebote` | Cennik — kolumna |
| `.angeboteGrid` | Siatka / kolumna pakietów |
| `.gallery--aktuell` | Aktuell |
| `.aktuellList` / `.aktuellItem` | Karta promocji |
| `.gallery--blog` / `.blogColumn` | Kolumna bloga |
| `.gallery--video` | Video |

---

## P2 — Elementy wewnętrzne (ostrożnie)

Te selektory mogą się zmieniać **tylko** przy redesignie z WWW-002:

| Selektor | Uwaga |
|----------|--------|
| `.angebotCard` | karta pakietu — treść OK, geometria chroniona |
| `.contact-row` | wiersz kontaktu |
| `.blogItem__media` | okno 16:9 bloga |
| `.blogItem__caption` | justowanie tekstu |

---

## CSS tokens (root)

| Token / atrybut | Zakaz |
|-----------------|-------|
| `:root`, `[data-theme="wedding"]` | zmiana palety bez PO |
| `--nf-layout-desktop` | plik tła desktop |
| `--nf-layout-portrait` | plik tła mobile portrait |
| `@media` breakpointy nav (`901px`) | bez WWW-002 |

---

## NFST — explicit deny list

NFST **nigdy** nie publikuje:

- `website/styles.css`
- `website/clock.css`
- `script.js`
- `website/frozen-ui.js`
- `index.html`

*(Już dziś poza scope NFST — utrzymać.)*

---

## WWW-002 — assert per ekran

Każdy wiersz powyżej ma odpowiadać screenshotowi w `references/layout/{viewport}/{screen}.png`.  
Diff > próg → deploy blocked.

---

## Checklist przed edycją CSS

1. Czy to P2 treść czy geometria?
2. Czy dotykam selektora z listy P0/P1?
3. Czy robię nowy breakpoint?
4. Czy zaktualizuję baseline WWW-002?

Jeśli 2 lub 3 = tak → **STOP** lub nowy epic layoutu.
