# WWW-001 — UI Freeze v1.1

**Status:** 🔒 FROZEN spec — **not deployed to production yet**  
**Projekt:** `noirframe.art`  
**Powiązane:** `website/frozen-ui.js`, `WWW-001A_Protected_Selectors.md`, `WWW-002_Layout_Freeze.md`, NFST `publisher/frozen_ui.rs`

---

## Zasada nadrzędna

**Strona jest systemem sterowanym treścią.**

| NFST może | NFST nie może |
|-----------|---------------|
| zdjęcia, bio, ceny, wpisy | CSS layout, breakpointy |
| kontakt (dane) | pozycje elementów |
| tagline, CTA (P3) | menu, nazwy sekcji (P0/P1) |

---

## Cztery poziomy (v1.1)

### P0 — Brand Locked

Nigdy nie ruszać. Render z `frozen-ui.js`. Publish guard w NFST.

| Obszar | Wartości |
|--------|----------|
| Wordmark | NF, NOIЯFRAME |
| Nav | Menü, Portfolio / Galerie, Wedding, Portrait, Reportage, Video, Angebote, Aktuell bei uns, Blog, About Us, Kontakt |
| Section H1 | ABOUT US, AKTUELL BEI UNS, ANGEBOTE, BLOG, VIDEO |

### P1 — UI Locked

Elementy systemowe / layout copy. Render z rejestru. Publish guard.

| Wartość |
|---------|
| BACK TO MENU |
| Wir sprechen |
| Büro & Organisation |

### P2 — Content Managed

NFST + JSON. Brak publish guard na treść.

- About: subline, role, opisy
- Kontakt: telefony, email, **lista języków** (Deutsch, Polski…)
- Angebote: nazwa pakietu, cena, opis, nota
- Blog: intro, wpisy, media
- Aktuell: kampanie
- Galerie / Video: pliki, captions

### P3 — Marketing Managed

Strefa szara — **świadomie nie zamrożone**.

| Przykład | Uwagi |
|----------|--------|
| Tagline (`Only light matters.`) | `blog.json` / `motion.json` → `footer` |
| CTA (`Anfrage senden`) | `angebote.json` → `ctaLabel` |
| Podtytuły sekcji | intro, subline |
| Podpis bloga (format) | JS dopina signature; treść wpisów — P2 |

**Reguła:** `NOIЯFRAME` + `Industrial Stories.` = marka (P0).  
`Behind the scenes…` = treść (P2/P3).

---

## Implementacja (stan lokalny)

| Warstwa | Stan |
|---------|------|
| `frozen-ui.js` | P0 + P1 |
| `script.js` | P0/P1 z rejestru; P2/P3 z JSON |
| NFST publish guards | ✅ Phase 2 (`frozen_ui.rs`) |
| WWW-001A selectors | ✅ dokument |
| WWW-002 snapshots | 📋 planned |

---

## Kolejność przed produkcją

1. ✅ WWW-001 v1.1 (4 poziomy, tagline odblokowany)
2. ✅ WWW-001 Phase 2 — Publish Guards
3. ✅ WWW-001A Protected Selectors
4. ✅ WWW-001B Asset Registry
5. ✅ WWW-002 baseline screenshots
6. ✅ Contact Mobile Fix
7. ✅ About Mobile Fix
8. 🔲 PROD PUSH

---

## Komunikat NFST przy naruszeniu

```
PUBLISH BLOCKED
Frozen UI violation detected.
Attempt to modify frozen field: about.json.headline
Expected: "ABOUT US"
Actual: "Speisekarte"
```

---

## Reguła Cursor / translatorów

Patrz `.cursor/rules/frozen-ui.mdc`
