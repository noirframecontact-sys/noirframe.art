# WWW-001B — Asset Registry

**Status:** 🔒 FROZEN spec + NFST enforcement  
**Machine-readable:** `assets/critical-registry.json`  
**NFST module:** `src-tauri/src/publisher/asset_registry.rs`

---

## Zasada

Jeżeli **krytyczny plik nie istnieje** w repo strony → **PUBLISH BLOCKED**.

Jeżeli NFST próbuje opublikować **chroniony plik** → **PUBLISH BLOCKED**.

---

## Critical assets (must exist on site)

| Plik | Rola |
|------|------|
| `images/layouts/layout_PC.jpg` | Tło desktop / landscape (wszystkie sekcje) |
| `images/layouts/layout_02.jpg` | Tło mobile portrait |
| `website/styles.css` | Geometria, layout, breakpointy |
| `website/frozen-ui.js` | Rejestr P0/P1 |
| `script.js` | Aplikacja strony |
| `index.html` | Entry point |

> **Uwaga:** Model 2-warstwowy — wspólne `layout_PC` + `layout_02` (bez `*_CONTACT.jpg`).  
> Nazwy `contact_PC.jpg` / `contact_02.jpg` z wcześniejszych planów **nie są używane**.

---

## Protected from NFST publish (never modify via Publish Live)

| Ścieżka | Powód |
|---------|--------|
| `website/*` | CSS, frozen-ui, clock |
| `script.js` | Logika UI |
| `index.html` | Shell |
| `images/layouts/*` | Tapety — zmiana tylko poza NFST (dev deploy) |

---

## NFST allowed publish scope

```
data/*.json
images/weddings/
images/portrait/
images/realestate/
images/motion/
images/team/
images/blog/
images/aktuell/
```

**Nie:** `styles.css`, `script.js`, `layouts/*`, rollback, nowe moduły.

---

## Komunikaty błędów

**Brak pliku:**
```
PUBLISH BLOCKED
Critical asset missing (WWW-001B):
images/layouts/layout_PC.jpg

Restore required files before Publish Live.
```

**Chroniony plik:**
```
PUBLISH BLOCKED
Protected asset violation (WWW-001B):
NFST cannot modify: images/layouts/layout_PC.jpg

Allowed: data/*.json and content images only.
```

---

## Kolejność guardów przy Publish Live

1. Asset Registry (existence)
2. Protected paths (NFST scope)
3. Frozen UI (P0/P1 JSON fields)

---

## Kontakt — tło

NFST **nie publikuje** już layoutów Kontaktu.  
Przycisk „Podmien tło” wyłączony (komunikat WWW-001B).
