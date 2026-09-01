# WWW-002 — Baseline Screenshots

**Status:** ✅ Baseline captured (post–mobile fix)  
**Folder:** `baseline/`

Minimalny zestaw wzorców — **6–7 ekranów**, nie cała strona.

---

## Matryca

| Plik | Viewport | Ekran |
|------|----------|-------|
| `desktop-menu.png` | 1920×1080 | Menu (po hero) |
| `desktop-about.png` | 1920×1080 | About Us |
| `desktop-contact.png` | 1920×1080 | Kontakt |
| `ipad-menu.png` | 810×1080 | Menu (portrait) |
| `ipad-about.png` | 810×1080 | About (portrait) |
| `mobile-menu.png` | 412×915 | Menu (Samsung portrait) |
| `mobile-contact.png` | 412×915 | Kontakt (Samsung portrait) |

---

## Capture

```powershell
cd D:\Projects\NOIRFRAME-WEDDING\noirframe.art
.\scripts\capture-www002-baselines.ps1 -BaseUrl "http://127.0.0.1:8080"
```

Domyślnie wymaga lokalnego serwera (`npx serve . -p 8080`).

Po **Contact Mobile Fix** i **About Mobile Fix** — **re-capture** baseline, potem PROD PUSH.

---

## Deploy gate (planned)

Playwright pixel diff vs `baseline/*.png` → fail = deploy blocked.

Known issue: `mobile-contact.png` może wymagać aktualizacji po fixie — to oczekiwane.

---

## Nawigacja w skrypcie

Menu: auto-wait hero → menu (4s).  
About / Contact: klik nav `#siteNav` → odpowiedni link.
