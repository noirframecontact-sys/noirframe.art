# INFRA-002 — DNS Migration Plan

**Projekt:** noirframe.art  
**Data audytu:** 2026-07-26  
**Status:** Plan do zatwierdzenia przez Product Ownera — **bez wdrożenia**  
**Metodologia:** diagnoza → decyzja → wdrożenie (jak eNFOP)

---

## 1. Executive Summary

Domena `noirframe.art` jest obecnie kierowana przez DNS Netcup na **Netlify** (legacy). Repozytorium GitHub i GitHub Pages są skonfigurowane poprawnie, ale **nie obsługują ruchu produkcyjnego**, ponieważ rekordy DNS nie wskazują na GitHub Pages.

**Rekomendacja:** migracja na **Opcję A — GitHub Pages + Cloudflare DNS** (proxy).

**Punkt zerwania:** warstwa DNS (Netcup → Netlify), nie kod ani manifesty.

---

## 2. Obecny stan (AS-IS)

### 2.1 Architektura faktyczna

```
Lokalny projekt (D:\Projects\NOIRFRAME-WEDDING\noirframe.art)
        ↓ push ✅
GitHub Repository (noirframecontact-sys/noirframe.art, main @ 2721f91)
        ↓
GitHub Pages ⚠️ skonfigurowane, lecz DNS omija
        ↓
Cloudflare ❌ nieaktywny dla noirframe.art
        ↓
Netcup DNS (nameservery: *.netcup.net)
        ↓
Netlify (astounding-vacherin-2bbee2.netlify.app)
        ↓
https://noirframe.art  ← snapshot ~commit b9bb6e7 (2026-07-05)
```

### 2.2 DNS Netcup — stan zmierzony (2026-07-26, resolver 8.8.8.8)

| Typ | Host | Wartość | TTL (domyślny SOA) | Rola |
|-----|------|---------|-------------------|------|
| **NS** | noirframe.art | `root-dns.netcup.net` | — | Autorytatywny DNS |
| **NS** | noirframe.art | `second-dns.netcup.net` | — | Autorytatywny DNS |
| **NS** | noirframe.art | `third-dns.netcup.net` | — | Autorytatywny DNS |
| **A** | `@` (apex) | **`75.2.60.5`** | 86400 s | **→ Netlify load balancer** |
| **CNAME** | `www` | **`astounding-vacherin-2bbee2.netlify.app`** | — | **→ Netlify site** |
| **MX** | `@` | brak | — | Brak poczty na domenie |
| **TXT** | `@` | brak (poza SOA) | — | Brak weryfikacji GitHub/CF |

> **Uwaga:** Pełna strefa DNS w panelu Netcup może zawierać dodatkowe rekordy niewidoczne z zewnątrz (np. `_domainkey`, subdomeny). **Przed migracją wykonać eksport/screenshot całej strefy z panelu Netcup.**

### 2.3 Rekordy prowadzące do Netlify

| Rekord | Wartość | Identyfikacja Netlify |
|--------|---------|----------------------|
| `A @` | `75.2.60.5` | Oficjalny IP load balancera Netlify |
| `CNAME www` | `astounding-vacherin-2bbee2.netlify.app` | Bezpośredni site ID Netlify |

**Dowód runtime HTTP:**
- `Server: Netlify`
- `Cache-Status: "Netlify Edge"`
- `X-Nf-Request-Id: 01KYF...`

### 2.4 Rozjazd repozytorium vs live

| Plik | Git HEAD | Live (noirframe.art) | Status |
|------|----------|---------------------|--------|
| `index.html` | 1401 B | 1401 B | ✅ zgodne |
| `script.js` | 6691 B | 6668 B | ❌ stare |
| `images/portrait/gallery.json` | 499 B (14 wpisów) | 237 B (12 wpisów) | ❌ stare |
| `images/portrait/foto10.jpg` | 79 KB | HTTP 404 | ❌ brak |
| `images/portrait/foto11.jpg` | istnieje | HTTP 404 | ❌ brak |

Live odpowiada snapshotowi **~commit `b9bb6e7`** (2026-07-05, „UP VIDEO").

### 2.5 Repozytorium Git — odwołania Netlify

**Brak.** Grep po repo: zero wystąpień `netlify`, `75.2.60.5`, `netlify.app`.

Netlify istnieje wyłącznie w **DNS Netcup**, nie w kodzie.

---

## 3. GitHub Pages — weryfikacja gotowości

### 3.1 Stan repozytorium

| Element | Wartość | Status |
|---------|---------|--------|
| Repo | `noirframecontact-sys/noirframe.art` | ✅ public |
| Branch | `main` | ✅ |
| HEAD | `2721f91` (2026-07-26) | ✅ aktualny |
| `has_pages` (GitHub API) | `true` | ✅ Pages włączone |
| Plik `CNAME` | `noirframe.art` | ✅ commit `3347258` |
| Plik `.nojekyll` | obecny | ✅ (wyłącza Jekyll) |
| Custom domain redirect | `github.io/...` → `301` → `noirframe.art` | ✅ domena rozpoznana |

### 3.2 Checklist gotowości GitHub Pages

| Wymaganie | Status | Uwagi |
|-----------|--------|-------|
| Custom Domain = `noirframe.art` | ⚠️ **Do potwierdzenia w UI** | API: `has_pages: true`; redirect 301 wskazuje na skonfigurowaną domenę |
| Plik `CNAME` w repo | ✅ | Zgodny z domeną |
| HTTPS | ⚠️ **Do potwierdzenia po migracji DNS** | Certyfikat GitHub wymaga poprawnego DNS wskazującego na Pages |
| Enforce HTTPS | ⚠️ **Do włączenia po migracji** | Settings → Pages → Enforce HTTPS |
| Status domeny | ⚠️ **Prawdopodobnie „DNS incorrect"** | DNS wskazuje na Netlify, nie GitHub |
| Ostatni deploy Pages | ⚠️ **Do potwierdzenia w UI** | Repo ma commity z 26.07; live serwuje wersję z 05.07 |

### 3.3 Weryfikacja przed migracją (PO do wykonania ręcznie)

1. GitHub → repo → **Settings → Pages**
2. Potwierdzić: Source = **Deploy from branch**, branch **`main`**, folder **`/ (root)`**
3. Custom domain: **`noirframe.art`** — sprawdzić badge (DNS check / verified)
4. Sprawdzić ostatni deploy (data, status green)
5. Tymczasowo sprawdzić zawartość bez custom domain:
   - `https://noirframecontact-sys.github.io/noirframe.art/images/portrait/gallery.json`
   - *(obecnie redirect 301 → noirframe.art → Netlify; po migracji DNS ten URL powinien serwować aktualne pliki)*

### 3.4 Werdykt GitHub Pages

**Repozytorium jest gotowe.** GitHub Pages jest włączone i rozpoznaje custom domain. **Ruch nie trafia na Pages** z powodu DNS. Po zmianie DNS Pages powinno przejąć hosting bez zmian w kodzie.

---

## 4. Cloudflare — ocena Opcji A

### 4.1 Porównanie opcji

| Kryterium | A: GitHub Pages + CF DNS | B: Cloudflare Pages |
|-----------|--------------------------|---------------------|
| Zmiana w repo | Brak | Brak (connect GitHub) |
| Zmiana build pipeline | Brak (GitHub buduje) | Nowy pipeline CF |
| Zgodność z obecnym flow | ✅ push → GitHub → auto deploy | ⚠️ wymaga nowej konfiguracji |
| Cache / CDN | ✅ Cloudflare proxy | ✅ natywny |
| SSL | GitHub origin + CF edge | CF managed |
| Złożoność migracji | **Niska** | Średnia |
| Ryzyko regresji | **Niskie** | Średnie |

### 4.2 Werdykt

**Opcja A (GitHub Pages + Cloudflare DNS) pozostaje najlepszym rozwiązaniem.**

Uzasadnienie:
- Repo, CNAME, `.nojekyll`, workflow verify-galleries — już na GitHubie
- Zero zmian w build pipeline
- Cloudflare daje DNS + cache + SSL edge (jak planowano)
- Metodologia eNFOP: minimalna zmiana, maksymalna kontrola

### 4.3 Docelowa architektura (TO-BE)

```
Lokalny projekt
        ↓ push
GitHub Repository (main)
        ↓ auto deploy
GitHub Pages (origin: pages.github.com)
        ↓
Cloudflare DNS (proxy ON, orange cloud)
        ↓ cache + SSL edge
https://noirframe.art
```

---

## 5. Docelowa konfiguracja DNS

### 5.1 Wariant zalecany: delegacja NS do Cloudflare

**Krok 0:** Dodać domenę `noirframe.art` w Cloudflare Dashboard.

**Krok 1:** W Netcup zmienić nameservery na te podane przez Cloudflare, np.:
```
<name>.ns.cloudflare.com
<name>.ns.cloudflare.com
```

**Krok 2:** W Cloudflare DNS ustawić:

| Typ | Nazwa | Wartość | Proxy | Uwagi |
|-----|-------|---------|-------|-------|
| **CNAME** | `@` | `noirframecontact-sys.github.io` | ✅ Proxied | CNAME flattening na apex |
| **CNAME** | `www` | `noirframecontact-sys.github.io` | ✅ Proxied | Redirect www → apex (Page Rule / Redirect Rule) |

**Alternatywa apex (gdy CNAME flattening niedostępny):**

| Typ | Nazwa | Wartość | Proxy |
|-----|-------|---------|-------|
| **A** | `@` | `185.199.108.153` | ✅ Proxied |
| **A** | `@` | `185.199.109.153` | ✅ Proxied |
| **A** | `@` | `185.199.110.153` | ✅ Proxied |
| **A** | `@` | `185.199.111.153` | ✅ Proxied |
| **CNAME** | `www` | `noirframecontact-sys.github.io` | ✅ Proxied |

> Oficjalne IP GitHub Pages: `185.199.108.153`, `.109.153`, `.110.153`, `.111.153`

### 5.2 Cloudflare — ustawienia po migracji

| Ustawienie | Wartość |
|------------|---------|
| SSL/TLS mode | **Full** (GitHub Pages ma własny cert) |
| Always Use HTTPS | ON |
| Automatic HTTPS Rewrites | ON |
| Minimum TLS | 1.2 |
| Cache Level | Standard |
| Browser Cache TTL | Respect Existing Headers |

**Page Rule / Redirect Rule (opcjonalnie):**
```
www.noirframe.art/* → https://noirframe.art/$1  (301)
```

### 5.3 Wariant alternatywny: DNS tylko w Netcup (bez delegacji NS)

Jeśli PO nie chce przenosić NS do Cloudflare:

| Akcja | Rekord | Stara wartość | Nowa wartość |
|-------|--------|---------------|--------------|
| **USUŃ** | A `@` | `75.2.60.5` | — |
| **USUŃ** | CNAME `www` | `astounding-vacherin-2bbee2.netlify.app` | — |
| **DODAJ** | A `@` | — | `185.199.108.153` |
| **DODAJ** | A `@` | — | `185.199.109.153` |
| **DODAJ** | A `@` | — | `185.199.110.153` |
| **DODAJ** | A `@` | — | `185.199.111.153` |
| **DODAJ** | CNAME `www` | — | `noirframecontact-sys.github.io` |

⚠️ Bez Cloudflare proxy: brak edge cache, brak ochrony DDoS, SSL tylko od GitHub.

---

## 6. Lista zmian DNS — podsumowanie

### 6.1 Rekordy do USUNIĘCIA (Netlify)

| Rekord | Wartość | Powód |
|--------|---------|-------|
| `A @` | `75.2.60.5` | Netlify load balancer — legacy |
| `CNAME www` | `astounding-vacherin-2bbee2.netlify.app` | Netlify site ID — legacy |

### 6.2 Rekordy do DODANIA (GitHub Pages via Cloudflare)

| Rekord | Wartość | Proxy CF |
|--------|---------|----------|
| `CNAME @` | `noirframecontact-sys.github.io` | ✅ (wariant zalecany) |
| `CNAME www` | `noirframecontact-sys.github.io` | ✅ |

*lub 4× A record na IP GitHub Pages (wariant fallback).*

### 6.3 Rekordy do POZOSTAWIENIA

| Rekord | Uwagi |
|--------|-------|
| Brak MX | Brak poczty — nic do migracji |
| Brak TXT | Brak SPF/DKIM — nic do migracji |
| Inne subdomeny | **Sprawdzić w panelu Netcup** przed migracją — jeśli istnieją (np. mail, api), nie usuwać |

### 6.4 Czego NIE ruszać w tej migracji

| Element | Powód |
|---------|-------|
| Repozytorium GitHub | Już aktualne |
| Pliki galerii / JS | Poza zakresem INFRA |
| Projekt Netlify | Wyłączenie dopiero po weryfikacji (Faza 5) |
| Inne domeny w Cloudflare (enfop, przyczepka) | Osobne projekty |

---

## 7. Plan migracji — checklista

### Faza 0 — Przygotowanie (D-1)

- [ ] **Backup DNS:** screenshot + eksport wszystkich rekordów z panelu Netcup
- [ ] **Backup DNS:** zapis bieżących wartości w tym dokumencie (patrz §2.2)
- [ ] **GitHub Pages UI:** potwierdzić Source = `main` / root, Custom domain = `noirframe.art`
- [ ] **GitHub Pages UI:** sprawdzić status ostatniego deploy (green)
- [ ] **Cloudflare:** dodać domenę `noirframe.art` (jeśli nie ma)
- [ ] **Cloudflare:** skonfigurować docelowe rekordy (bez zmiany NS — jeszcze nieaktywne)
- [ ] **Komunikacja:** poinformować PO o planowanym oknie migracji
- [ ] **Rollback gotowy:** zachować stare wartości DNS (§9)

### Faza 1 — Preflight (D-day, T-0)

- [ ] Potwierdzić: repo HEAD = oczekiwany commit (`2721f91` lub nowszy)
- [ ] Potwierdzić: `raw.githubusercontent.com/.../gallery.json` ma 14 wpisów z `foto10`, `foto11`
- [ ] Obniżyć TTL starych rekordów do 300 s (jeśli Netcup pozwala — **24 h wcześniej**)
- [ ] Sprawdzić brak aktywnych kampanii / QR kodów wymagających zero downtime

### Faza 2 — Migracja DNS (D-day, T+0)

- [ ] **Opcja A (zalecana):** zmienić NS w Netcup na Cloudflare
- [ ] **lub Opcja B:** zamienić rekordy A/CNAME bezpośrednio w Netcup (§5.3)
- [ ] W Cloudflare: włączyć proxy (orange cloud) na rekordach `@` i `www`
- [ ] Cloudflare SSL/TLS → **Full**
- [ ] **NIE usuwać** projektu Netlify (jeszcze)

### Faza 3 — Weryfikacja propagacji (T+15 min → T+4 h)

- [ ] Sprawdzić propagację: [https://dnschecker.org/#A/noirframe.art](https://dnschecker.org/#A/noirframe.art)
- [ ] Oczekiwany wynik: IP Cloudflare (proxy) lub GitHub Pages IP (bez proxy)
- [ ] **NIE** powinno być: `75.2.60.5`
- [ ] GitHub → Settings → Pages → Custom domain: status **Verified** + certyfikat HTTPS aktywny

### Faza 4 — Testy funkcjonalne (T+1 h → T+4 h)

| Test | URL | Oczekiwany wynik |
|------|-----|-----------------|
| Strona główna | `https://noirframe.art/` | HTTP 200, brak `Server: Netlify` |
| Manifest | `https://noirframe.art/images/portrait/gallery.json` | 14 wpisów, zawiera `"foto10.jpg"`, `"foto11.jpg"` |
| Zdjęcie 10 | `https://noirframe.art/images/portrait/foto10.jpg` | HTTP 200, ~79 KB |
| Zdjęcie 11 | `https://noirframe.art/images/portrait/foto11.jpg` | HTTP 200 |
| index.html | `https://noirframe.art/index.html` | HTTP 200, rozmiar = git HEAD |
| HTTPS | `http://noirframe.art` | Redirect → HTTPS |
| www | `https://www.noirframe.art` | Redirect → apex lub 200 |
| Nagłówki | brak `X-Nf-Request-Id` | Potwierdzenie braku Netlify |
| Galeria UI | Portrait tile → scroll | 14 zdjęć widocznych |

**Kryterium sukcesu:** wszystkie testy PASS.

### Faza 5 — Wyłączenie Netlify (T+24 h, po stabilizacji)

- [ ] Potwierdzić 24 h stabilnego działania na GitHub Pages + Cloudflare
- [ ] Netlify Dashboard → site `astounding-vacherin-2bbee2` → **disable** (nie delete)
- [ ] Zachować site przez 7 dni na wypadek rollback
- [ ] Po 7 dniach: opcjonalnie usunąć site z Netlify
- [ ] Zaktualizować dokumentację projektu

---

## 8. Ocena ryzyka

| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| DNS propagation delay | Wysokie | Średni | Niski TTL przed migracją; test dnschecker.org |
| GitHub HTTPS cert delay | Średnie | Średni | Poczekać do 24 h; CF Full SSL jako backup |
| Stary cache Netlify/CF | Średnie | Niski | Purge CF cache po migracji; Ctrl+Shift+R |
| Ukryte rekordy DNS w Netcup | Niskie | Wysoki | Pełny eksport strefy przed migracją |
| GitHub Pages build fail | Niskie | Wysoki | Preflight: sprawdzić deploy status przed DNS |
| Email disruption | **Brak** | — | Brak rekordów MX |
| Rollback needed | Niskie | Średni | Przywrócić stare rekordy DNS (§9) |

**Ogólna ocena ryzyka: NISKIE–ŚREDNIE** przy warunku pełnego backupu DNS i braku ukrytych subdomen.

---

## 9. Plan rollback

### Kiedy rollback

- Po 4 h testy nadal FAIL (gallery.json bez foto10/foto11)
- Certyfikat HTTPS niedostępny po 24 h
- Strona niedostępna (5xx / timeout)

### Procedura rollback (< 15 min)

1. Przywrócić w Netcup **oryginalne rekordy:**
   ```
   A     @     75.2.60.5
   CNAME www   astounding-vacherin-2bbee2.netlify.app
   ```
2. Jeśli zmieniono NS → przywrócić NS Netcup:
   ```
   root-dns.netcup.net
   second-dns.netcup.net
   third-dns.netcup.net
   ```
3. Poczekać na propagację (TTL zależny od ustawień)
4. Zweryfikować: strona wraca do stanu sprzed migracji (stara wersja, ale dostępna)
5. Udokumentować przyczynę i zaplanować ponowną migrację

> **Uwaga:** Rollback przywraca **starą wersję strony** (Netlify snapshot z 05.07), nie najnowszą z GitHub. To świadomy kompromis: dostępność > aktualność.

---

## 10. Przewidywany czas propagacji

| Etap | Czas |
|------|------|
| Zmiana rekordów DNS | 5 min |
| Propagacja lokalna (PL) | 15 min – 2 h |
| Propagacja globalna | 2 – 24 h |
| GitHub Pages cert provisioning | 15 min – 24 h |
| Cloudflare SSL active | Natychmiast (proxy) |
| Pełna stabilizacja | **24 h** |
| Bezpieczne wyłączenie Netlify | **+24 h** po stabilizacji |

**Rekomendowane okno migracji:** wtorek–czwartek, 10:00–14:00 CET (niska frekwencja, czas na reakcję).

---

## 11. Decyzje wymagane od Product Ownera

| # | Decyzja | Opcje |
|---|---------|-------|
| 1 | Delegacja NS do Cloudflare vs rekordy tylko w Netcup | **A: Cloudflare NS** (zalecane) / B: Netcup only |
| 2 | Okno migracji (data + godzina) | PO wybiera |
| 3 | Redirect www → apex | Tak (zalecane) / Nie |
| 4 | Kiedy wyłączyć Netlify | +24 h / +7 dni po sukcesie |
| 5 | Kto wykonuje zmiany DNS | PO / dev / wspólnie |

---

## 12. Po zatwierdzeniu planu

1. PO zatwierdza §11
2. Wykonawca realizuje Fazy 0–5 według checklisty §7
3. Po sukcesie: zamknąć ticket INFRA-002, otworzyć INFRA-003 (post-migration verification)
4. BUG-WWW-003 (manifest drift) powinien rozwiązać się automatycznie po migracji DNS

---

*Dokument wygenerowany na podstawie audytu INFRA-001 (2026-07-26). Żadne zmiany DNS, GitHub Pages ani Netlify nie zostały wykonane.*
