# INFRA-003 — FAZA 1: Cloudflare Preparation

**Data:** 2026-07-26 20:30 CET  
**Wykonawca:** Cursor Agent  
**Status:** ✅ COMPLETE — oczekiwanie na decyzję PO przed FAZĄ 2  
**Poprzednia faza:** FAZA 0 zaakceptowana przez PO

---

## 1. Cel FAZY 1

Przygotowanie konfiguracji Cloudflare dla migracji `noirframe.art` → GitHub Pages.

**W tej fazie nie wykonano żadnych zmian:**
- ❌ Netcup — nietknięty
- ❌ Netlify — nietknięty
- ❌ Cloudflare DNS — nietknięty
- ❌ GitHub Pages — nietknięty
- ❌ Kod strony — nietknięty

---

## 2. Weryfikacja: czy domena istnieje w Cloudflare?

### 2.1 Testy automatyczne (2026-07-26)

| Test | Wynik | Interpretacja |
|------|-------|---------------|
| NS publiczne | `root-dns.netcup.net`, `second-dns.netcup.net`, `third-dns.netcup.net` | **Domena NIE jest delegowana do Cloudflare** |
| NS zawiera `*.ns.cloudflare.com` | ❌ brak | Cloudflare nie jest autorytatywnym DNS |
| HTTP header `CF-RAY` | ❌ brak | Ruch nie przechodzi przez Cloudflare proxy |
| HTTP header `Server` | `Netlify` | Potwierdza obecny host (Netlify) |
| Subdomeny `_cloudflare`, `cf`, `cdn` | ❌ brak rekordów | Brak śladów konfiguracji CF |

### 2.2 Werdykt

**`noirframe.art` NIE jest obecnie aktywna w Cloudflare DNS** (brak delegacji NS).

Domena może być dodana do konta Cloudflare w stanie **„Pending”** (oczekuje na zmianę NS) — tego nie da się zweryfikować z zewnątrz. **PO musi sprawdzić panel Cloudflare ręcznie.**

### 2.3 Procedura weryfikacji manualnej (PO)

1. Zaloguj się na [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Sprawdź listę domen w **Account Home**
3. Szukaj: **`noirframe.art`**

| Scenariusz | Co zrobić |
|------------|-----------|
| **Domena NIE istnieje** | Wykonaj procedurę dodania (§3) |
| **Domena istnieje, status „Active”** | NS już wskazują CF — **kontynuuj od §4** (konfiguracja rekordów) |
| **Domena istnieje, status „Pending”** | NS jeszcze w Netcup — **kontynuuj od §4**, potem FAZA 2 |
| **Domena istnieje w innym koncie CF** | Przenieś domenę lub użyj właściwego konta |

---

## 3. Procedura dodania domeny do Cloudflare (jeśli nie istnieje)

### Krok 1 — Dodaj domenę

1. Cloudflare Dashboard → **Add a site**
2. Wpisz: `noirframe.art`
3. Wybierz plan: **Free** (wystarczający)
4. Kliknij **Continue**

### Krok 2 — Skan DNS

Cloudflare zeskanuje obecne rekordy publiczne. Oczekiwany wynik skanu:

| Typ | Nazwa | Wartość (obecna) | Uwaga |
|-----|-------|------------------|-------|
| A | `noirframe.art` | `75.2.60.5` | ⚠️ Netlify — **USUNĄĆ w §4** |
| CNAME | `www` | `astounding-vacherin-2bbee2.netlify.app` | ⚠️ Netlify — **USUNĄĆ w §4** |

> Cloudflare może nie wykryć wszystkich rekordów z Netcup. Porównaj ze scanem z FAZY 0.

### Krok 3 — Wybierz plan i kontynuuj

Plan **Free** → **Continue**

### Krok 4 — Zapisz nameservery Cloudflare

Cloudflare wygeneruje **unikalną parę nameserverów** dla tej domeny.

**Format (przykład — Twoje będą inne):**
```
ada.ns.cloudflare.com
bob.ns.cloudflare.com
```

⚠️ **Nameservery są generowane per-domena.** Nie da się ich podać z wyprzedzeniem — PO musi je skopiować z ekranu Cloudflare po dodaniu domeny i wpisać do §5 tego raportu przed FAZĄ 2.

### Krok 5 — NIE zmieniaj NS w Netcup (jeszcze)

Cloudflare pokaże instrukcję „Update your nameservers”. **To wykonamy w FAZIE 2** po akceptacji PO.

### Krok 6 — Konfiguruj rekordy DNS (§4)

Przed zmianą NS w Netcup — ustaw docelowe rekordy w Cloudflare.

---

## 4. Docelowa konfiguracja DNS w Cloudflare

### 4.1 Architektura docelowa

```
GitHub Repository (noirframecontact-sys/noirframe.art)
        ↓ auto deploy (branch main)
GitHub Pages (origin)
        ↓
Cloudflare DNS (proxy ON ☁️)
        ↓ cache + SSL edge
https://noirframe.art
```

### 4.2 GitHub Pages — target DNS

| Parametr | Wartość |
|----------|---------|
| Repo | `noirframecontact-sys/noirframe.art` |
| GitHub Pages URL | `https://noirframecontact-sys.github.io/noirframe.art/` |
| CNAME target (DNS) | **`noirframecontact-sys.github.io`** |
| Plik `CNAME` w repo | `noirframe.art` ✅ |
| Custom domain w GitHub | `noirframe.art` (do potwierdzenia w UI) |

> **Ważne (GitHub Docs):** CNAME dla subdomeny `www` musi wskazywać na `noirframecontact-sys.github.io` — **bez** nazwy repozytorium w ścieżce.

### 4.3 Rekordy DNS — wariant zalecany (CNAME flattening)

Cloudflare obsługuje CNAME na apex (@) dzięki CNAME flattening.

| # | Typ | Nazwa | Wartość | Proxy | TTL | Uwagi |
|---|-----|-------|---------|-------|-----|-------|
| 1 | **CNAME** | `@` | `noirframecontact-sys.github.io` | ☁️ **Proxied** | Auto | Apex → GitHub Pages |
| 2 | **CNAME** | `www` | `noirframecontact-sys.github.io` | ☁️ **Proxied** | Auto | Subdomena www |

**Rekordy do USUNIĘCIA w Cloudflare (po imporcie skanu):**

| Typ | Nazwa | Wartość | Powód |
|-----|-------|---------|-------|
| A | `@` | `75.2.60.5` | Netlify legacy |
| CNAME | `www` | `astounding-vacherin-2bbee2.netlify.app` | Netlify legacy |

**Rekordy, które NIE powinny istnieć:**

| Typ | Nazwa | Powód |
|-----|-------|-------|
| AAAA | `@` | Niepotrzebne przy proxy CF + GitHub A |
| Wildcard `*` | `@` | GitHub odradza — ryzyko domain takeover |
| TXT | `_github-pages-challenge-*` | Tylko jeśli GitHub wymaga weryfikacji |

### 4.4 Rekordy DNS — wariant alternatywny (A records na apex)

Jeśli CNAME flattening na `@` sprawia problemy:

| # | Typ | Nazwa | Wartość | Proxy |
|---|-----|-------|---------|-------|
| 1 | A | `@` | `185.199.108.153` | ☁️ Proxied |
| 2 | A | `@` | `185.199.109.153` | ☁️ Proxied |
| 3 | A | `@` | `185.199.110.153` | ☁️ Proxied |
| 4 | A | `@` | `185.199.111.153` | ☁️ Proxied |
| 5 | CNAME | `www` | `noirframecontact-sys.github.io` | ☁️ Proxied |

Oficjalne IP GitHub Pages (IPv4): `185.199.108.153`, `.109.153`, `.110.153`, `.111.153`

### 4.5 Ustawienia Cloudflare (SSL/TLS i reguły)

| Ustawienie | Lokalizacja | Wartość | Uwagi |
|------------|-------------|---------|-------|
| **SSL/TLS encryption mode** | SSL/TLS → Overview | **Full** | Nie „Full (strict)" na start — cert GitHub może potrzebować czasu |
| **Always Use HTTPS** | SSL/TLS → Edge Certificates | **ON** | |
| **Automatic HTTPS Rewrites** | SSL/TLS → Edge Certificates | **ON** | |
| **Minimum TLS Version** | SSL/TLS → Edge Certificates | **1.2** | |
| **Universal SSL** | SSL/TLS → Edge Certificates | Active | Auto po propagacji |

**Redirect Rule (opcjonalnie, zalecane):**

| Reguła | Wartość |
|--------|---------|
| If | Hostname equals `www.noirframe.art` |
| Then | Redirect to `https://noirframe.art/$1` (301) |

GitHub Pages automatycznie redirectuje między apex ↔ www po poprawnej konfiguracji DNS — ta reguła jest opcjonalna.

### 4.6 Cache — zalecenia po migracji

| Ustawienie | Wartość |
|------------|---------|
| Caching Level | Standard |
| Browser Cache TTL | Respect Existing Headers |
| Purge Cache | Wykonać po FAZIE 4 (Purge Everything) |

---

## 5. Nameservery Cloudflare (do uzupełnienia przez PO)

Nameservery zostaną wygenerowane po dodaniu domeny w Cloudflare (§3, Krok 4).

**PO: wklej tutaj nameservery z panelu Cloudflare przed FAZĄ 2:**

```
NS 1: _________________________________.ns.cloudflare.com
NS 2: _________________________________.ns.cloudflare.com
```

**Obecne nameservery Netcup (do zastąpienia w FAZIE 2):**

```
root-dns.netcup.net
second-dns.netcup.net
third-dns.netcup.net
```

---

## 6. Checklist konfiguracji Cloudflare (PO wykonuje ręcznie)

### Przed FAZĄ 2

- [ ] Zalogować się do Cloudflare Dashboard
- [ ] Sprawdzić czy `noirframe.art` istnieje (§2.3)
- [ ] Jeśli nie — dodać domenę (§3)
- [ ] Skopiować nameservery CF → §5
- [ ] Usunąć rekordy Netlify z strefy CF:
  - [ ] `A @ → 75.2.60.5`
  - [ ] `CNAME www → astounding-vacherin-2bbee2.netlify.app`
- [ ] Dodać docelowe rekordy (§4.3):
  - [ ] `CNAME @ → noirframecontact-sys.github.io` (Proxied ☁️)
  - [ ] `CNAME www → noirframecontact-sys.github.io` (Proxied ☁️)
- [ ] Ustawić SSL/TLS → **Full**
- [ ] Włączyć **Always Use HTTPS**
- [ ] (Opcjonalnie) Redirect Rule www → apex
- [ ] **NIE zmieniać NS w Netcup** — to FAZA 2
- [ ] **NIE usuwać Netlify** — to FAZA 5

### GitHub (PO sprawdza równolegle)

- [ ] GitHub → repo → Settings → Pages
- [ ] Source: Deploy from branch → `main` / `/ (root)`
- [ ] Custom domain: `noirframe.art` — ustawione
- [ ] Ostatni deploy: status green

---

## 7. Weryfikacja gotowości przed FAZĄ 2

| Warunek | Status |
|---------|--------|
| Domena dodana w Cloudflare | ⚠️ PO potwierdza |
| Rekordy Netlify usunięte ze strefy CF | ⚠️ PO wykonuje |
| Rekordy GitHub Pages dodane w CF | ⚠️ PO wykonuje |
| SSL/TLS = Full | ⚠️ PO wykonuje |
| Nameservery CF skopiowane do §5 | ⚠️ PO uzupełnia |
| NS w Netcup — **bez zmian** | ✅ |
| Netlify — **bez zmian** | ✅ |

---

## 8. Ryzyka specyficzne dla FAZY 1

| Ryzyko | Mitygacja |
|--------|-----------|
| Domena dodana do złego konta CF | PO weryfikuje konto przed dodaniem |
| Cloudflare import pominie ukryte rekordy | Porównać z backupem FAZY 0 |
| Proxy ON blokuje cert GitHub | SSL mode = Full (nie Strict) na start |
| Duplikat rekordów A + CNAME na apex | Usunąć stary A Netlify przed dodaniem CNAME |

---

## 9. Następny krok

**STOP — FAZA 1 COMPLETE**

PO wykonuje checklist §6 w panelu Cloudflare, uzupełnia §5 (nameservery), potem zatwierdza → **FAZA 2** (przygotowanie zmian NS w Netcup).

---

## 10. Szybka ściągawka — co wpisać w Cloudflare DNS

```
USUŃ:
  A     noirframe.art          →  75.2.60.5
  CNAME www                    →  astounding-vacherin-2bbee2.netlify.app

DODAJ:
  CNAME noirframe.art    →  noirframecontact-sys.github.io   [Proxied ☁️]
  CNAME www              →  noirframecontact-sys.github.io   [Proxied ☁️]

SSL/TLS:  Full
HTTPS:    Always Use HTTPS = ON
```

---

*Wygenerowano automatycznie. Żadne zmiany DNS, Cloudflare, Netcup ani Netlify nie zostały wykonane.*
