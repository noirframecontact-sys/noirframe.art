# INFRA-003 — FAZA 0: DNS Backup & State Verification

**Data:** 2026-07-26 20:23 CET  
**Wykonawca:** Cursor Agent  
**Status:** ✅ COMPLETE — oczekiwanie na potwierdzenie PO przed FAZĄ 1

---

## 1. Cel FAZY 0

- Zweryfikować aktualny stan infrastruktury
- Wykonać backup konfiguracji DNS (rollback reference)
- Potwierdzić gotowość GitHub Pages do przejęcia ruchu

**Żadne zmiany DNS nie zostały wykonane.**

---

## 2. Backup DNS — stan przed migracją

> Źródło: publiczne resolvery DNS (8.8.8.8, 1.1.1.1, 9.9.9.9) + wcześniejszy audyt INFRA-001/002.  
> ⚠️ **PO powinien dodatkowo wykonać screenshot/export pełnej strefy z panelu Netcup** — mogą istnieć rekordy niewidoczne publicznie.

### 2.1 Nameservery (autorytatywne)

| # | Nameserver |
|---|-----------|
| 1 | `root-dns.netcup.net` |
| 2 | `second-dns.netcup.net` |
| 3 | `third-dns.netcup.net` |

**Potwierdzone na:** Google 8.8.8.8, Cloudflare 1.1.1.1, Quad9 9.9.9.9 — spójne.

### 2.2 Rekordy DNS (publicznie widoczne)

| Typ | Host | Wartość | TTL (SOA default) | Provider | Akcja przy migracji |
|-----|------|---------|-------------------|----------|---------------------|
| **NS** | `@` | `root-dns.netcup.net` | — | Netcup | Zmienić na Cloudflare NS (FAZA 2) |
| **NS** | `@` | `second-dns.netcup.net` | — | Netcup | Zmienić na Cloudflare NS (FAZA 2) |
| **NS** | `@` | `third-dns.netcup.net` | — | Netcup | Zmienić na Cloudflare NS (FAZA 2) |
| **A** | `@` (apex) | **`75.2.60.5`** | 86400 s | **Netlify** | **USUNĄĆ** |
| **CNAME** | `www` | **`astounding-vacherin-2bbee2.netlify.app`** | — | **Netlify** | **USUNĄĆ** |
| **MX** | `@` | brak | — | — | Pozostawić (brak poczty) |
| **TXT** | `@` | brak | — | — | Pozostawić |
| **AAAA** | `@` | brak | — | — | Pozostawić |

### 2.3 SOA Record

```
Primary NS:  root-dns.netcup.net
Admin:       dnsadmin.netcup.net
Serial:      2026070210
Refresh:     28800 (8h)
Retry:       7200 (2h)
Expire:      1209600 (14d)
Default TTL: 86400 (24h)
```

### 2.4 Identyfikacja Netlify

| Element | Wartość |
|---------|---------|
| Apex IP | `75.2.60.5` (Netlify load balancer / AWS Global Accelerator) |
| Site ID | `astounding-vacherin-2bbee2.netlify.app` |
| HTTP Server | `Netlify` |
| HTTP Cache-Status | `"Netlify Edge"; hit` |
| HTTP X-Nf-Request-Id | `01KYFTQAXJKV3DQ2DCQ3D1QVJZ` (2026-07-26) |
| Cloudflare CF-RAY | **brak** (Cloudflare nie proxy'uje) |

---

## 3. Weryfikacja runtime (live vs GitHub)

| Test | GitHub (HEAD) | Live (noirframe.art) | Status |
|------|--------------|---------------------|--------|
| Commit | `2721f91` (2026-07-26) | ~`b9bb6e7` (2026-07-05) | ❌ rozjazd |
| `gallery.json` wpisy | 14 | 12 | ❌ |
| `foto10.jpg` w manifeście | ✅ | ❌ | ❌ |
| `foto10.jpg` HTTP | istnieje w repo | **404** | ❌ |
| `foto11.jpg` HTTP | istnieje w repo | **404** | ❌ |
| `index.html` rozmiar | 1401 B | 1401 B | ✅ |
| `script.js` rozmiar | 6691 B | 6668 B | ❌ |
| Hosting | GitHub Pages (oczekiwany) | **Netlify** (faktyczny) | ❌ |

---

## 4. GitHub Pages — gotowość

| Element | Wartość | Status |
|---------|---------|--------|
| Repo | `noirframecontact-sys/noirframe.art` | ✅ |
| Branch | `main` | ✅ |
| HEAD | `2721f91` | ✅ |
| `has_pages` (API) | `true` | ✅ |
| Plik `CNAME` | `noirframe.art` | ✅ |
| Plik `.nojekyll` | obecny | ✅ |
| Ostatni push | 2026-07-26T17:21:46Z | ✅ |
| Custom domain redirect | `github.io → 301 → noirframe.art` | ✅ skonfigurowane |
| DNS wskazuje na Pages | **NIE** (wskazuje Netlify) | ❌ blokuje deploy |

**Werdykt:** GitHub Pages gotowe do przejęcia ruchu po zmianie DNS.

---

## 5. Cloudflare — stan przed migracją

| Element | Status |
|---------|--------|
| Domena `noirframe.art` w Cloudflare | ⚠️ **Do potwierdzenia przez PO w panelu** |
| NS wskazują na Cloudflare | ❌ (obecnie Netcup) |
| Proxy aktywny | ❌ |
| CF-RAY w nagłówkach | ❌ |

---

## 6. Rollback reference (przywrócenie Netlify)

W razie problemów po migracji — przywrócić w Netcup:

```
NS:  root-dns.netcup.net
     second-dns.netcup.net
     third-dns.netcup.net

A:   @ → 75.2.60.5

CNAME: www → astounding-vacherin-2bbee2.netlify.app
```

Czas rollback: ~15 min (+ propagacja TTL do 24 h).

---

## 7. Checklist FAZY 0

- [x] DNS NS zweryfikowane (3 resolvery, spójne)
- [x] Rekordy A/CNAME zidentyfikowane (Netlify)
- [x] Brak MX/TXT (brak ryzyka poczty)
- [x] HTTP runtime potwierdza Netlify
- [x] GitHub vs live rozjazd udokumentowany
- [x] GitHub Pages readiness potwierdzona
- [x] Backup zapisany w tym dokumencie
- [ ] **PO: screenshot/export pełnej strefy DNS z panelu Netcup** (do wykonania ręcznie)
- [ ] **PO: potwierdzenie obecności domeny w Cloudflare** (do wykonania ręcznie)

---

## 8. Następny krok

**STOP — FAZA 0 COMPLETE**

Czekam na potwierdzenie PO przed rozpoczęciem **FAZY 1** (konfiguracja Cloudflare).

---

*Wygenerowano automatycznie. Żadne rekordy DNS nie zostały zmienione.*
