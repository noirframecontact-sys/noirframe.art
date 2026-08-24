# INFRA-003 — FAZA 2: Cloudflare Onboarding

**Data:** 2026-07-26 20:35 CET  
**Wykonawca:** Cursor Agent  
**Status:** ✅ COMPLETE — oczekiwanie na nameservery Cloudflare od PO  
**Poprzednie fazy:** FAZA 0 ✅ · FAZA 1 ✅  
**Potwierdzenie PO:** domena `noirframe.art` **NIE istnieje** w Cloudflare

---

## 1. Cel FAZY 2

Przygotować onboarding domeny `noirframe.art` do Cloudflare — **bez zmiany Netcup, GitHub Pages ani Netlify**.

Po tej fazie PO powinien mieć:
- domenę dodaną w Cloudflare (status **Pending**),
- zaimportowaną strefę DNS,
- **dwa nameservery Cloudflare** (do przekazania przed FAZĄ 3),
- przygotowane rekordy docelowe GitHub Pages (jeszcze nieaktywne publicznie).

> **Ważne:** Dopóki NS w Netcup wskazują na Netcup, zmiany w strefie Cloudflare **nie wpływają** na live `noirframe.art`. Strona nadal idzie przez Netlify.

---

## 2. Procedura krok po kroku (Product Owner)

### KROK 1 — Logowanie

1. Otwórz [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Zaloguj się na konto, na którym są inne projekty (enfop, przyczepka)
3. Upewnij się, że jesteś w **właściwym account/organizacji**

---

### KROK 2 — Add a Site

1. Kliknij **„Add a site”** (lub **„Onboard a domain”**)
2. W pole wpisz dokładnie:
   ```
   noirframe.art
   ```
3. Kliknij **Continue**

⚠️ Nie dodawaj `www.noirframe.art` — dodajemy apex. Subdomena `www` skonfiguruje się rekordem DNS.

---

### KROK 3 — Wybór planu

1. Cloudflare zaproponuje plan **Free**
2. Wybierz **Free** (0 USD)
3. Kliknij **Continue**

Plan Free wystarcza: DNS, proxy CDN, SSL edge, basic DDoS.

---

### KROK 4 — Import strefy DNS (DNS Scan)

Cloudflare automatycznie przeskanuje publiczne rekordy.

**Oczekiwany wynik skanu:**

| Typ | Nazwa | Wartość | Źródło |
|-----|-------|---------|--------|
| A | `noirframe.art` | `75.2.60.5` | Netlify |
| CNAME | `www` | `astounding-vacherin-2bbee2.netlify.app` | Netlify |

**Możliwe dodatkowe rekordy** (jeśli Cloudflare je wykryje — porównaj z backupem FAZY 0):
- MX (poczta) — zachować
- TXT (SPF, weryfikacja) — zachować
- inne subdomeny — zachować, oznaczyć do review

1. Przejrzyj listę zaimportowanych rekordów
2. **Nie usuwaj nic na tym etapie**
3. Kliknij **Continue**

---

### KROK 5 — Weryfikacja rekordów po imporcie

Porównaj zaimportowaną strefę z backupem FAZY 0:

| Check | Oczekiwane | Akcja PO |
|-------|-----------|----------|
| A `@` = `75.2.60.5` | ✅ Netlify | **Zachować** (FAZA 2) |
| CNAME `www` → `*.netlify.app` | ✅ Netlify | **Zachować** (FAZA 2) |
| Brak nieoczekiwanych rekordów | ✅ | Jeśli są — screenshot + notatka |
| Brak wildcard `*` | ✅ | Jeśli jest — oznaczyć do usunięcia przed cutover |

**Checklist weryfikacji importu:**
- [ ] Rekord A `@` → `75.2.60.5` obecny
- [ ] Rekord CNAME `www` → Netlify obecny
- [ ] Brak duplikatów A na `@`
- [ ] Brak rekordów, których nie rozpoznajesz (jeśli są → STOP, konsultacja)

---

### KROK 6 — Przygotuj rekordy docelowe GitHub Pages (jeszcze nie usuwaj Netlify)

W tej samej strefie DNS Cloudflare **dodaj** (nie zastępuj) rekordy docelowe:

| Typ | Nazwa | Wartość | Proxy | Status |
|-----|-------|---------|-------|--------|
| CNAME | `@` | `noirframecontact-sys.github.io` | ☁️ Proxied | **Dodać teraz** |
| CNAME | `www` | `noirframecontact-sys.github.io` | ☁️ Proxied | **Dodać teraz** |

> **Uwaga techniczna:** Na apex (`@`) nie mogą współistnieć rekord **A** (Netlify) i **CNAME** (GitHub) — Cloudflare może zablokować lub ostrzec. Jeśli CF nie pozwala na oba:
> - **Opcja A:** Dodaj tylko CNAME `www` → GitHub teraz; rekord apex `@` dodasz przy cutover (FAZA 3)
> - **Opcja B:** Zostaw Netlify A `@` do cutover; dodaj GitHub CNAME `@` dopiero w FAZIE 3 tuż przed zmianą NS

**Rekomendacja:** W FAZIE 2 dodaj CNAME `www` → GitHub. Rekord apex `@` → GitHub skonfigurujesz w FAZIE 3 (zastąpienie A Netlify).

---

### KROK 7 — Ustawienia SSL/TLS (przygotowanie)

Przejdź do **SSL/TLS → Overview**:

| Ustawienie | Wartość |
|------------|---------|
| Encryption mode | **Full** |

Przejdź do **SSL/TLS → Edge Certificates**:

| Ustawienie | Wartość |
|------------|---------|
| Always Use HTTPS | **ON** |
| Automatic HTTPS Rewrites | **ON** |

> Certyfikat Universal SSL aktywuje się po zmianie NS (FAZA 3).

---

### KROK 8 — Odczyt nameserverów Cloudflare

Cloudflare wyświetli ekran **„Update your nameservers”** z **dwoma unikalnymi nameserverami**.

**Przykładowy format (Twoje będą inne):**
```
ada.ns.cloudflare.com
bob.ns.cloudflare.com
```

1. **Skopiuj oba nameservery**
2. **Wklej je do §8 tego raportu** (lub wyślij do Cursora)
3. **NIE zmieniaj jeszcze NS w Netcup** — to FAZA 3

---

### KROK 9 — Potwierdź status domeny

Po dodaniu domena powinna mieć status:

| Status | Znaczenie | OK? |
|--------|-----------|-----|
| **Pending** | NS jeszcze w Netcup — oczekiwane w FAZIE 2 | ✅ |
| **Active** | NS już wskazują Cloudflare — przedwczesne w FAZIE 2 | ⚠️ sprawdź NS |
| **Moved** | Domena w innym koncie CF | ❌ STOP |

---

## 3. Rekordy — co zachować po imporcie

### 3.1 ZACHOWAĆ (nie usuwać w FAZIE 2)

| Rekord | Wartość | Powód |
|--------|---------|-------|
| A `@` | `75.2.60.5` | Referencja rollback; live nadal przez Netcup/Netlify |
| CNAME `www` | `astounding-vacherin-2bbee2.netlify.app` | j.w. |
| MX (jeśli wykryty) | dowolny | Poczta — nie ruszać |
| TXT (jeśli wykryty) | dowolny | Weryfikacje — nie ruszać |
| Inne subdomeny (jeśli wykryte) | dowolne | Review przed cutover |

### 3.2 DODAĆ (przygotowanie docelowe — FAZA 2)

| Rekord | Wartość | Proxy |
|--------|---------|-------|
| CNAME `www` | `noirframecontact-sys.github.io` | ☁️ Proxied |
| CNAME `@` | `noirframecontact-sys.github.io` | ☁️ Proxied *(lub FAZA 3 jeśli konflikt z A)* |

### 3.3 NIE DODAWAĆ

| Rekord | Powód |
|--------|-------|
| Wildcard `*` | GitHub odradza — ryzyko domain takeover |
| A `@` → GitHub IP obok A `@` → Netlify | Konflikt na apex — zastąpić, nie duplikować |
| Rekordy Netlify w nowych miejscach | Niepotrzebne |

---

## 4. Rekordy Netlify — kiedy usunąć

### 4.1 Zasada

| Co | Kiedy usunąć | Faza |
|----|-------------|------|
| **Rekordy DNS Netlify w strefie Cloudflare** | Przy **cutover DNS** (tuż przed/po zmianie NS) | **FAZA 3** |
| **Projekt Netlify (hosting/dashboard)** | Po potwierdzeniu, że strona działa na GitHub+CF | **FAZA 5** |

### 4.2 Rekordy Netlify do usunięcia z Cloudflare (FAZA 3 — nie teraz)

| Typ | Nazwa | Wartość | Usunąć w |
|-----|-------|---------|---------|
| A | `@` | `75.2.60.5` | FAZA 3 (cutover) |
| CNAME | `www` | `astounding-vacherin-2bbee2.netlify.app` | FAZA 3 (cutover) |

> **Dlaczego nie teraz (FAZA 2)?** Strefa CF nie jest jeszcze aktywna publicznie. Rekordy Netlify służą jako dokumentacja rollback i nie szkodzą. Live i tak idzie przez Netcup → Netlify.

> **Dlaczego nie dopiero po FAZIE 4?** Po zmianie NS (FAZA 3) Cloudflare staje się autorytatywny. Jeśli A `@` → Netlify nadal istnieje, ruch pójdzie na Netlify, nie GitHub. **Usunięcie/zastąpienie rekordów Netlify w CF musi nastąpić w FAZIE 3.**

### 4.3 Projekt Netlify — zostawić do FAZY 5

| Element | Akcja w FAZIE 2 | Akcja w FAZIE 5 |
|---------|-----------------|-----------------|
| Site `astounding-vacherin-2bbee2` | **Nie usuwać** | Disable po 24 h stabilizacji |
| Kredyty Netlify | Bez znaczenia (nie deployujemy) | — |

---

## 5. Harmonogram rekordów DNS (podsumowanie)

```
FAZA 2 (teraz — onboarding):
  ✅ Import Netlify A + CNAME www
  ✅ Zachować rekordy Netlify w strefie CF
  ✅ Dodać rekordy GitHub (www + opcjonalnie @)
  ❌ Nie zmieniać NS w Netcup
  → Live: nadal Netlify

FAZA 3 (cutover — po nameserverach):
  ⚠️ Usunąć rekordy Netlify ze strefy CF
  ⚠️ Upewnić się, że rekordy GitHub aktywne
  ⚠️ Zmienić NS w Netcup → Cloudflare
  → Live: zaczyna iść przez Cloudflare → GitHub

FAZA 4 (weryfikacja):
  ✅ Test gallery.json, foto10, foto11, HTTPS

FAZA 5 (sprzątanie):
  🗑️ Disable projekt Netlify w dashboard
```

---

## 6. Checklist Product Ownera — FAZA 2

### A. Dodanie domeny

- [ ] Zalogowałem się do [dash.cloudflare.com](https://dash.cloudflare.com)
- [ ] Kliknąłem **Add a site**
- [ ] Wpisałem: `noirframe.art`
- [ ] Wybrałem plan **Free**
- [ ] Przeszedłem przez DNS scan

### B. Weryfikacja importu

- [ ] Zaimportowany A `@` → `75.2.60.5` ✅
- [ ] Zaimportowany CNAME `www` → `astounding-vacherin-2bbee2.netlify.app` ✅
- [ ] Brak nieznanych rekordów (lub: opisane poniżej)
- [ ] Screenshot strefy DNS zapisany

### C. Przygotowanie rekordów GitHub

- [ ] Dodany CNAME `www` → `noirframecontact-sys.github.io` (Proxied ☁️)
- [ ] Dodany CNAME `@` → `noirframecontact-sys.github.io` (Proxied ☁️) *(lub zaplanowany na FAZĘ 3)*
- [ ] SSL/TLS → **Full**
- [ ] Always Use HTTPS → **ON**
- [ ] **Nie usunąłem** rekordów Netlify ze strefy CF

### D. Nameservery Cloudflare

- [ ] Odczytałem nameservery z ekranu Cloudflare
- [ ] Wpisałem je w §8 poniżej
- [ ] Przekazałem nameservery Cursorowi / zapisałem w bezpiecznym miejscu
- [ ] **Nie zmieniałem** NS w Netcup

### E. Potwierdzenie statusu

- [ ] Status domeny w CF: **Pending** (oczekiwany)
- [ ] Live `noirframe.art` nadal działa (Netlify) — brak regresji
- [ ] Gotowy do FAZY 3

---

## 7. Czego NIE robić w FAZIE 2

| Akcja | Powód |
|-------|-------|
| ❌ Zmiana NS w Netcup | To FAZA 3 — czekamy na nameservery |
| ❌ Usuwanie rekordów Netlify z CF | To FAZA 3 (cutover) |
| ❌ Usuwanie projektu Netlify | To FAZA 5 |
| ❌ Zmiana GitHub Pages settings | Poza zakresem |
| ❌ Zmiana kodu / galerii / JS | Poza zakresem |
| ❌ Purge cache Cloudflare | Jeszcze nieaktywne |

---

## 8. Nameservery Cloudflare — DO UZUPEŁNIENIA PRZEZ PO

> **PO: wklej tutaj nameservery wygenerowane przez Cloudflare po dodaniu domeny.**

```
NS 1: _________________________________.ns.cloudflare.com
NS 2: _________________________________.ns.cloudflare.com
```

**Data odczytu:** _______________

**Status domeny w CF po dodaniu:** [ ] Pending  [ ] Active  [ ] Inne: _______

---

## 9. Nameservery obecne (Netcup) — referencja rollback

```
root-dns.netcup.net
second-dns.netcup.net
third-dns.netcup.net
```

*(Bez zmian w FAZIE 2. Przywrócić w razie rollback.)*

---

## 10. Następny krok

**STOP — FAZA 2 COMPLETE (dokumentacja)**

PO wykonuje checklist §6 w panelu Cloudflare.

**Cursor czeka na:**
1. Nameservery z §8 (wypełnione przez PO)
2. Potwierdzenie checklisty §6
3. Decyzję PO → **FAZA 3** (cutover NS w Netcup)

---

## 11. Szablon wiadomości do Cursora po FAZIE 2

```
FAZA 2 done.

Nameservery Cloudflare:
NS1: ________.ns.cloudflare.com
NS2: ________.ns.cloudflare.com

Status CF: Pending
Import DNS: OK (A @ 75.2.60.5, CNAME www → netlify)
Rekordy GitHub dodane: [tak/nie — www / @]
Netlify rekordy w CF: zachowane
NS w Netcup: bez zmian

Gotowy na FAZĘ 3.
```

---

*Wygenerowano automatycznie. Netcup, GitHub Pages, Netlify — bez zmian.*
