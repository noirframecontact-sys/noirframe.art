# NFPM-001 — NF Studio Tools v1.0

> **Superseded by [NFPM-001 v1.1](./NFPM-001_NF_Studio_Tools_Spec_v1.1.md)** — decyzje PO z 2026-07-26.

**Status:** Architecture & UX — NO CODE  **Data:** 2026-07-26  
**Projekt:** Noir Frame (`noirframe.art`)  
**Poprzednia nazwa robocza:** NF Portfolio Manager → **NF Studio Tools**

---

## Manifest

> **NF Studio Tools zarządza decyzjami fotografa.**  
> **Silnik publikacji zarządza konsekwencjami technicznymi.**  
> **Fotograf nigdy nie widzi warstwy technicznej.**

---

## 1. Cel produktu

Małe okno desktopowe zastępujące cały techniczny workflow publikacji galerii:

| ❌ Fotograf nigdy nie używa | ✅ Zastąpione przez |
|-----------------------------|---------------------|
| PowerShell | NF Studio Tools |
| Git / GitHub Web | 🚀 Publikuj |
| Cloudflare panel | automatyczny krok publikacji |
| Terminal | — |
| Ręczna edycja `gallery.json` | automatyczny krok publikacji |

**To nie jest CMS. To nie jest panel administracyjny. To narzędzie publikacji.**

---

## 2. Zakres v1.0

### W zakresie

- 3 galerie: **Wedding**, **Portrait**, **Real Estate**
- Wybór galerii, drag & drop zdjęć, publikacja jednym przyciskiem
- Automatyczny pipeline publikacji (patrz §6)
- Checklist postępu publikacji (§8)
- Status końcowy: 🟢 Gotowe / 🔴 Błąd
- Historia publikacji (biznesowa, nie Git)
- Rollback ostatniej publikacji per galeria

### Poza zakresem v1.0

- Portfolio (osobna sekcja strony — przyszły moduł)
- Mission Control, zakładki, ustawienia w UI
- Logowanie, konta użytkowników
- CMS, edycja treści, SEO, blog, social media
- Integracja z eNFOP (v1.1+ — patrz §15)
- WebP / AVIF (v1.1 — v1.0 publikuje JPG zgodnie z obecną stroną)
- Staging / preview branch

---

## 3. Mapowanie na infrastrukturę

| UI (NF Studio Tools) | Folder w repo | URL na stronie |
|----------------------|---------------|----------------|
| Wedding | `images/weddings/` | `#weddings` |
| Portrait | `images/portrait/` | `#portrait` |
| Real Estate | `images/realestate/` | `#realestate` |

**Manifest:** `images/{folder}/gallery.json`

```json
{
  "images": [
    "foto01.jpg",
    "foto02.jpg
  ]
}
```

Format zgodny z istniejącym `script.js` — tablica stringów, sortowanie po numerze `fotoNN`.

**Repo:** `noirframecontact-sys/noirframe.art` (branch `main`)  
**Hosting:** GitHub Pages  
**CDN/DNS:** Cloudflare (po INFRA-003)

---

## 4. Ekrany UI

### 4.1 Ekran główny (jedyny ekran roboczy)

```
NOIRFRAME
Studio Tools
────────────────────────────
Wedding      (6 zdjęć)
Portrait     (14 zdjęć)
Real Estate  (5 zdjęć)
────────────────────────────
📁 Dodaj zdjęcia
🚀 Publikuj
────────────────────────────
Status
🟢 Gotowe
```

**Interakcje:**
- Klik na galerię → zaznaczenie aktywnej galerii (podświetlenie)
- Liczba zdjęć = stan **lokalny roboczy** (draft), nie live
- „Dodaj zdjęcia" → dialog plików lub drag & drop na okno
- „Publikuj" → aktywne tylko gdy wybrana galeria ma nieopublikowane zmiany

**Czego nie ma:** menu, zakładek, ustawień, ikon Git/Cloudflare.

### 4.2 Ekran publikacji (overlay na głównym)

```
📷  Analiza zdjęć          ✓ Portrait · 14 zdjęć
🖼  Tworzenie miniatur     ✓
📋  Aktualizacja galerii   ✓
🌐  Publikacja             ✓
☁   Cloudflare             ✓
✔   Gotowe

https://noirframe.art
```

Przy błędzie — krok z ✗ i komunikat po polsku (§9).

### 4.3 Historia publikacji (panel rozwijany / dolny drawer)

Nie jest osobną zakładką — rozwija się z ikony 🕐 lub linku „Historia" pod statusem.

```
26.07.2026  21:41   Portrait
                    +3 zdjęcia  −1 zdjęcie
                    ✔ Opublikowano
                    [ Przywróć ]

24.07.2026  18:22   Wedding
                    +5 zdjęć
                    ✔ Opublikowano
                    [ Przywróć ]
```

---

## 5. Workflow użytkownika

```
1. Uruchom NF Studio Tools
2. Wybierz galerię (np. Portrait)
3. Przeciągnij zdjęcia JPG/JPEG
4. Kliknij 🚀 Publikuj
5. Obserwuj checklistę
6. Status: 🟢 Gotowe
```

**Koniec.** Żadnych dodatkowych kroków.

---

## 6. Pipeline publikacji (automatyczny)

Po kliknięciu „Publikuj" silnik wykonuje sekwencję **atomową**:

| # | Krok (UI) | Akcja wewnętrzna | Rollback lokalny |
|---|-----------|-------------------|------------------|
| 1 | Analiza zdjęć | Walidacja formatu, rozmiaru, liczby; skan istniejących `fotoNN` | — |
| 2 | Tworzenie miniatur | Generacja `_thumb.jpg` (lazy load na stronie) | Usuń nowe pliki |
| 3 | Aktualizacja galerii | Rename → `foto01.jpg`…`fotoNN.jpg`; zapis `gallery.json` | Przywróć snapshot |
| 4 | Publikacja | Commit + push przez GitHub API | Nie commituj |
| 5 | Cloudflare | Oczekiwanie na GitHub Pages deploy; purge cache | — |
| 6 | Weryfikacja | HTTP GET każdego zdjęcia + `gallery.json` na live | Oznacz jako failed |
| 7 | Gotowe | Zapis do historii publikacji | — |

**Zasada:** krok 4 (commit) następuje **dopiero po** pomyślnym zakończeniu kroków 1–3.  
Krok 6 musi potwierdzić dostępność online — dopiero wtedy publikacja jest „✔ Opublikowano".

---

## 7. Architektura projektu

### 7.1 Rekomendacja: Tauri 2

```
┌─────────────────────────────────────────────────────────┐
│  NF Studio Tools.exe                                     │
│  ┌─────────────────────┐  ┌───────────────────────────┐ │
│  │  UI Layer           │  │  Publisher Engine         │ │
│  │  (HTML/CSS/TS)      │◄─┤  (Rust)                   │ │
│  │  · galerie          │  │  · image pipeline         │ │
│  │  · drag & drop      │  │  · manifest builder       │ │
│  │  · checklist SSE    │  │  · github client          │ │
│  │  · historia         │  │  · cloudflare client      │ │
│  └─────────────────────┘  │  · snapshot / rollback    │ │
│                            │  · SQLite (historia)      │ │
│                            └───────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
   %APPDATA%/NFStudioTools/      GitHub API + Cloudflare API
   · credentials (DPAPI)
   · workspace (draft)
   · snapshots
   · publications.db
```

### 7.2 Porównanie technologii

| Kryterium | Tauri 2 | Electron | Python + Qt | HTML + WebView2 wrapper |
|-----------|---------|----------|-------------|-------------------------|
| Rozmiar instalatora | ~8 MB | ~150 MB | ~80 MB | ~30 MB |
| Zużycie RAM | niskie | wysokie | średnie | niskie |
| Przetwarzanie obrazów | Rust (`image` crate) — szybkie | Node (sharp) — OK | Pillow — dobre | zależy od backendu |
| Bezpieczeństwo tokenów | natywny keyring | keytar / safeStorage | keyring | Windows Credential Manager |
| Dystrybucja Windows | MSI/NSIS | Squirrel/electron-builder | PyInstaller — problematyczne | ręczne |
| UI drag & drop | WebView — naturalne | WebView — naturalne | Qt — więcej pracy | WebView — OK |
| Ekstrakcja do serwisu (v1.1) | łatwa (Rust core) | średnia | trudna | średnia |
| Krzywa uczenia | Rust backend | JS full-stack | Python | C# + web |

**Rekomendacja: Tauri 2**

**Uzasadnienie:**
1. **Jeden instalator, mały footprint** — fotograf nie instaluje Node/Python.
2. **Rust backend** — szybkie przetwarzanie setek zdjęć, bezpieczna obsługa HTTP/API.
3. **Web UI** — prosty interfejs (3 galerie, 1 przycisk) bez kompromisów wizualnych.
4. **Ścieżka ewolucji** — Publisher Engine w Rust można w v1.1 wydzielić jako usługę `localhost:4785` bez przepisywania logiki; eNFOP staje się drugim klientem.
5. **Windows Credential Manager** — natywna integracja przez `keyring` crate.

**Alternatywa:** Electron — jeśli zespół nie chce Rusta. Akceptowalne, ale cięższe i wolniejsze przy batch image processing.

**Odrzucone:**
- **Python + Qt** — słaba dystrybucja na Windows (PyInstaller, antywirusy, brak auto-update).
- **Sam HTML + wrapper** — brak backendu; i tak potrzebujesz silnika publikacji obok.

---

## 8. Struktura katalogów projektu

```
nf-studio-tools/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── publisher/
│   │   │   ├── pipeline.rs       # sekwencja kroków
│   │   │   ├── images.rs         # rename, thumbs
│   │   │   ├── manifest.rs       # gallery.json
│   │   │   ├── github.rs         # GitHub Contents API
│   │   │   ├── cloudflare.rs     # purge + verify
│   │   │   ├── snapshot.rs       # rollback
│   │   │   └── verify.rs         # live check
│   │   ├── storage/
│   │   │   ├── credentials.rs    # DPAPI / keyring
│   │   │   └── publications.rs   # SQLite
│   │   └── commands.rs           # Tauri IPC
│   └── tauri.conf.json
├── src/                          # UI (React/Svelte/Vanilla)
│   ├── App.tsx
│   ├── GalleryList.tsx
│   ├── PublishOverlay.tsx
│   └── HistoryDrawer.tsx
├── NFPM-001_NF_Studio_Tools_Spec_v1.0.md
└── README.md
```

**Osobne repo** od `noirframe.art` — aplikacja desktopowa ≠ strona WWW.

---

## 9. Obsługa błędów (fail-fast, jasny komunikat)

### 9.1 Zasady

1. **Fail-fast** — błąd na dowolnym kroku zatrzymuje pipeline.
2. **Nie commituj** — jeśli kroki 1–3 fail, GitHub nie jest dotykany.
3. **Commit bez weryfikacji = „Publikacja nieudana"** — jeśli krok 6 fail po commicie, użytkownik widzi błąd + opcja rollback.
4. **Komunikat po polsku, bez jargonu technicznego.**

### 9.2 Mapowanie błędów → UI

| Błąd wewnętrzny | Komunikat dla fotografa |
|-----------------|-------------------------|
| Invalid image format | „Nieprawidłowy format pliku. Użyj JPG lub JPEG." |
| Image too large (>25 MB) | „Zdjęcie jest za duże (max 25 MB)." |
| GitHub API 401/403 | „Brak połączenia ze stroną. Skontaktuj się z administratorem." |
| GitHub API 409 (conflict) | „Galeria została zmieniona z innego miejsca. Spróbuj ponownie." |
| Cloudflare purge fail | „Strona opublikowana, ale cache nie odświeżony. Zdjęcia mogą być widoczne za kilka minut." |
| Live verify 404 | „Publikacja nieudana — zdjęcia nie są widoczne online. Zmiany cofnięte." |
| Network timeout | „Brak połączenia z internetem. Sprawdź sieć i spróbuj ponownie." |
| Disk full | „Brak miejsca na dysku." |

**Reguła:** nigdy nie pokazuj „GitHub API error 422", „commit SHA", „HTTP 500".

### 9.3 Diagram stanów publikacji

```
[IDLE]
  │ Publikuj
  ▼
[PREPARING] ──fail──► [FAILED] → komunikat + draft zachowany
  │ ok
  ▼
[COMMITTING] ──fail──► [FAILED] → draft zachowany, GitHub nietknięty
  │ ok
  ▼
[DEPLOYING] ──fail──► [FAILED] → rollback commit + komunikat
  │ ok
  ▼
[VERIFYING] ──fail──► [FAILED] → rollback commit + komunikat
  │ ok
  ▼
[PUBLISHED] → 🟢 Gotowe + wpis w historii
```

---

## 10. Bezpieczne przechowywanie tokenów

### 10.1 Zasada

Tokeny **nigdy** w plikach konfiguracyjnych, `.env`, rejestrze Windows w plain text, ani w repo.

### 10.2 Mechanizm (Windows)

| Token | Magazyn | Uprawnienia minimalne |
|-------|---------|----------------------|
| GitHub PAT | Windows Credential Manager (via `keyring`) | `repo` (Contents read/write) |
| Cloudflare API Token | Windows Credential Manager | Zone.Cache Purge + Zone.Zone Read |

**Target w Credential Manager:**
```
Service: nf-studio-tools
User: github-token
User: cloudflare-token
User: cloudflare-zone-id
User: github-repo-owner
User: github-repo-name
```

### 10.3 Pierwsze uruchomienie (Setup Wizard — jednorazowy)

Przy **pierwszym** uruchomieniu (tylko raz, poza v1.0 UI — może być prosty wizard lub konfiguracja przez developera):

1. Wprowadzenie GitHub PAT → zapis w Credential Manager
2. Wprowadzenie Cloudflare Token + Zone ID → zapis w Credential Manager
3. Test połączenia → ✓

**W v1.0 dla jednego użytkownika:** setup wykonuje developer/administrator jednorazowo. Fotograf nigdy nie widzi tego ekranu.

### 10.4 Rotacja tokenów

Komenda wewnętrzna (CLI flaga `--reconfigure-tokens` lub menu kontekstowe ukryte pod Shift+klik logo) — nie w normalnym UI.

---

## 11. Rollback jednej publikacji

### 11.1 Model

Przed każdą publikacją silnik tworzy **snapshot**:

```
%APPDATA%/NFStudioTools/snapshots/
  pub-2026-07-26-2141/
    gallery.json
    foto01.jpg
    foto02.jpg
    ...
    _meta.json          # lista plików, count, gallery name
```

Snapshot = kopia stanu **live** tuż przed publikacją (pobrana z GitHub API lub lokalnego cache).

### 11.2 Procedura rollback

```
1. Użytkownik klika [ Przywróć ] przy wpisie w historii
2. UI: „Przywracam galerię Portrait z 24.07.2026…"
3. Silnik:
   a. Wczytuje snapshot pub-{id}
   b. Wykonuje kroki 1–3 (przygotowanie lokalne)
   c. Commit + push (przywrócone pliki)
   d. Cloudflare purge
   e. Weryfikacja live
4. Nowy wpis w historii: „Przywrócono wersję z 24.07.2026"
```

### 11.3 Ograniczenia v1.0

- Rollback dostępny dla **ostatnich 10 publikacji** per galeria
- Snapshots przechowywane max **30 dni** (potem auto-cleanup)
- Rollback w trakcie innej publikacji — zablokowany

### 11.4 Wewnętrzna implementacja (niewidoczna)

Rollback technicznie = nowy commit z plikami ze snapshotu.  
Alternatywnie: GitHub API revert commit — ale użytkownik nigdy nie widzi słowa „revert" ani „commit".

---

## 12. Historia publikacji (SQLite)

### 12.1 Schema

```sql
CREATE TABLE publications (
  id            TEXT PRIMARY KEY,   -- pub-2026-07-26-2141
  timestamp     TEXT NOT NULL,
  gallery       TEXT NOT NULL,       -- wedding | portrait | realestate
  added         INTEGER DEFAULT 0,
  removed       INTEGER DEFAULT 0,
  reordered     INTEGER DEFAULT 0,
  status        TEXT NOT NULL,       -- published | failed | rolled_back
  snapshot_path TEXT,
  _commit_sha   TEXT,               -- NIGDY nie eksponowane w UI
  error_message TEXT                -- NULL jeśli OK; po polsku
);

CREATE TABLE publication_steps (
  publication_id TEXT REFERENCES publications(id),
  step_name      TEXT,               -- analyze | thumbs | manifest | deploy | cache | verify
  status         TEXT,               -- ok | failed | skipped
  duration_ms    INTEGER,
  detail         TEXT                -- np. "14 zdjęć"
);
```

### 12.2 Co widzi fotograf vs co wie silnik

| Pole | UI | Silnik |
|------|-----|--------|
| `id` | ✓ (jako data + godzina) | ✓ |
| `gallery` | ✓ | ✓ |
| `added/removed` | ✓ | ✓ |
| `_commit_sha` | ✗ | ✓ (rollback) |
| `error_message` | ✓ (po polsku) | ✓ |

---

## 13. Workspace lokalny (draft)

```
%APPDATA%/NFStudioTools/workspace/
  wedding/
    draft/              # zdjęcia dodane, jeszcze nie opublikowane
    live-cache/         # ostatni znany stan live (sync z GitHub)
  portrait/
    draft/
    live-cache/
  realestate/
    draft/
    live-cache/
```

**Przy starcie aplikacji:** sync `live-cache/` z GitHub API (cichy, w tle).  
**Liczba zdjęć w UI:** `live-cache` + `draft`.  
**Wskaźnik zmian:** draft ≠ live-cache → „Publikuj" aktywny.

---

## 14. Konfiguracja (poza UI)

Plik `%APPDATA%/NFStudioTools/config.toml` — **bez tokenów**:

```toml
[site]
domain = "noirframe.art"
repo_owner = "noirframecontact-sys"
repo_name = "noirframe.art"
branch = "main"

[galleries]
wedding = "images/weddings"
portrait = "images/portrait"
realestate = "images/realestate"

[publish]
max_image_size_mb = 25
allowed_extensions = ["jpg", "jpeg"]
verify_timeout_sec = 120
deploy_poll_interval_sec = 5
deploy_timeout_sec = 300

[snapshots]
max_count_per_gallery = 10
retention_days = 30
```

---

## 15. Ścieżka ewolucji (poza v1.0)

| Wersja | Co dodaje | Architektura |
|--------|-----------|--------------|
| **v1.0** | Portfolio publish | Monolit Tauri (UI + Engine) |
| **v1.1** | WebP, staging branch | Engine bez zmian w UI |
| **v1.2** | Wydzielenie Engine → `localhost:4785` | NF Studio Tools + eNFOP jako klienci |
| **v2.0** | Mission Control, blog, SEO | eNFOP hub + NF Publisher Service |

Nazwa **NF Studio Tools** pozwala dodać moduły (Backup, Optimize) bez rebrandingu.

---

## 16. Wymagania niefunkcjonalne

| Wymaganie | Wartość |
|-----------|---------|
| Platforma | Windows 10/11 (x64) |
| Użytkownicy | 1 (Marcin) |
| Czas publikacji 20 zdjęć | < 3 min (w tym deploy) |
| Rozmiar instalatora | < 15 MB |
| Auto-update | v1.1 (Tauri updater) |
| Offline | Dodawanie zdjęć działa offline; publikacja wymaga sieci |
| Język UI | Polski |

---

## 17. Zależności infrastrukturalne

NF Studio Tools v1.0 wymaga **domknięcia INFRA-003**:

- [ ] Cloudflare onboarding (Faza 2)
- [ ] NS cutover Netcup → Cloudflare (Faza 3)
- [ ] Weryfikacja GitHub Pages live (Faza 4)
- [ ] Wyłączenie Netlify (Faza 5)

Bez tego weryfikacja live (krok 6) będzie failować.

---

## 18. Definition of Done — v1.0

- [ ] Instalator Windows (.msi)
- [ ] 3 galerie: wybór, drag & drop, licznik zdjęć
- [ ] Publikuj: pełny pipeline §6
- [ ] Checklist §4.2 z real-time postępem
- [ ] Status 🟢/🔴
- [ ] Historia publikacji §4.3
- [ ] Rollback §11
- [ ] Zero terminologii Git w UI
- [ ] Tokeny w Credential Manager §10
- [ ] Test E2E: Portrait +3 zdjęcia → live na noirframe.art → rollback

---

## 19. Decyzje do zatwierdzenia (PO)

| # | Decyzja | Rekomendacja |
|---|---------|--------------|
| 1 | Nazwa produktu | **NF Studio Tools** |
| 2 | Stack | **Tauri 2** |
| 3 | Osobne repo | **tak** (`nf-studio-tools`) |
| 4 | Miniaturki w v1.0 | **tak** (`_thumb.jpg`) |
| 5 | WebP w v1.0 | **nie** (v1.1) |
| 6 | Setup tokenów | **developer jednorazowo** |
| 7 | Portfolio gallery | **poza v1.0** |

---

## 20. Odpowiedzi na pytania architektoniczne

### Q1: Electron / Tauri / Python+Qt / HTML+wrapper?

→ **Tauri 2.** Uzasadnienie: §7.2.

### Q2: Jak bezpiecznie przechowywać tokeny?

→ **Windows Credential Manager** via Rust `keyring` crate. Minimalne uprawnienia. Setup jednorazowy poza UI fotografa. §10.

### Q3: Jak zaprojektować publikację z fail-fast?

→ **Staging lokalny → commit dopiero po przygotowaniu → weryfikacja live obowiązkowa.** Błąd = stop + komunikat po polsku. §9.

### Q4: Jak zaimplementować rollback?

→ **Snapshot przed publikacją + nowy publish ze snapshotu.** UI: „Przywróć". Wewnętrznie: commit z przywróconymi plikami. §11.

---

*NFPM-001 v1.0 — spec only, no code.*
