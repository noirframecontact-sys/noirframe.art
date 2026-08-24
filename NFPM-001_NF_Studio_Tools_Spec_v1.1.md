# NFPM-001 — NF Studio Tools

**Status:** 🔒 **FROZEN** — Architecture, UX & Product Philosophy — NO CODE  
**Wersja dokumentu:** 1.1 (ostateczna)  
**Data zamrożenia:** 2026-07-26  
**Projekt:** Noir Frame (`noirframe.art`)  
**Repo aplikacji:** `nf-studio-tools` (osobne od `noirframe.art` i eNFOP)

> Ten dokument to nie tylko specyfikacja programu.  
> **To specyfikacja sposobu pracy Noir Frame.**

### 🔒 Dokument zamrożony

Ten dokument **nie podlega rozszerzaniu**. Nie dopisujemy do niego v1.2, ustawień, AI, SEO, bloga, social media ani kolejnych zakładek.

Każda nowa funkcja wymaga **osobnego dokumentu** (np. NFPM-002) i świadomej decyzji PO o odmrożeniu zakresu.

**Zagrożeniem nie jest brak funkcji. Zagrożeniem jest pokusa, żeby zrobić go „jeszcze trochę lepszym".**

---
## Product Principles

### Zasada decyzji

> **Każdy przycisk w programie odpowiada jednej decyzji fotografa.**  
> **Nigdy jednej operacji technicznej.**

Dzięki temu za rok w programie nie będzie przycisków *Commit*, *Purge Cache* ani *Deploy*.  
Zamiast tego będzie: **⬆ Aktualizuj Portrait**.

| Decyzja fotografa | Przycisk |
|-------------------|----------|
| „Chcę nowe zdjęcia w Portrait na stronie" | ⬆ Aktualizuj Portrait |
| „Chcę wrócić do wczorajszej wersji" | Przywróć |
| „Chcę sprawdzić, czy wszystko się dobrze przygotuje" | ○ Test |

### Zasada 90 sekund

> **Każda rutynowa aktualizacja ma zamknąć się w mniej niż 90 sekund**  
> od uruchomienia programu do komunikatu *Gotowe*.

To nie cel wydajnościowy — to **cel projektowy**.

Jeśli kiedyś aktualizacja wymaga: 12 kliknięć, 5 okien, konfiguracji, zastanawiania się — projekt zboczył z kursu.

**Definicja rutynowej aktualizacji:** 1–5 nowych zdjęć w jednej galerii, program już uruchomiony, sieć OK.

**Sukces v1.0:** za pół roku dodajesz trzy nowe zdjęcia w minutę — bez PowerShella, GitHuba ani Cloudflare.

### Zasada niewidzialności

> **Technologia jest sukcesem tylko wtedy, gdy fotograf nie musi o niej myśleć.**

Dzisiaj walczyliśmy z: PowerShellem, GitHubem, Netcup, Cloudflare, DNS, cache.  
Użytkownik nie powinien nawet wiedzieć, że one istnieją.

PowerShell, Git, GitHub, Cloudflare, DNS — to **problem silnika**, nie problem fotografa.

### Rule of One

> **Program ma tylko jedno główne zadanie. Nie pięć. Nie trzy. Jedno.**

Jeżeli użytkownik otwiera NF Studio Tools — wie, po co go otworzył. I program też to wie.

**Jedno zadanie:** aktualizacja portfolio na stronie.

Wszystko inne (Test, Przywróć, synchronizacja) istnieje **wyłącznie** na rzecz tego jednego zadania — nigdy obok niego.

### Benchmark produktu

> **Aktualizacja portfolio ma być prostsza niż dodanie zdjęć do Facebooka.**

To jest genialny benchmark. Nie wydajność. Nie feature parity. **Prostota.**

---
## Prawdziwy cel projektu

> *„Chodzi mi o to, żebym za pomocą małego okna mógł aktualizować galerie — i nigdy więcej nie przechodził przez to, co dzisiaj."*

To jedno zdanie uratowało projekt.

Początkowo projektowaliśmy usługę, API, endpointy, mikroserwisy.  
Właściwe pytanie br brzmi inaczej:

**Jak sprawić, żebym nie musiał drugi raz przechodzić przez dzisiejszy dzień?**

Reszta może poczekać.

---

## Manifest

> **NF Studio Tools zarządza decyzjami fotografa.**  
> **Silnik publikacji zarządza konsekwencjami technicznymi.**  
> **Fotograf nigdy nie widzi warstwy technicznej.**

---

## 0. Filozofia: buduj procedurę, nie aplikację

NF Studio Tools to nie okno z przyciskami. To **procedura aktualizacji portfolio** zamknięta w `.exe`.

Program **nie publikuje**. Program **aktualizuje portfolio** — sprawia, że nowe zdjęcia pojawiają się na stronie.

### Co widzi użytkownik

```
📷 Dodaj zdjęcia
        ↓
⬆ Aktualizuj Portrait  (lub ○ Test)
        ↓
✔ Gotowe
```

### Co wykonuje procedura (niewidoczne)

```
PowerShell → gallery.json → GitHub → Pages → Cloudflare → cache → test → gotowe
```

**Definicja dobrego narzędzia:** cała techniczna „magia" istnieje, ale nigdy nie wychodzi na powierzchnię.

Procedura ma **dwa tryby** (patrz §5):
- **Test** — pełne przygotowanie, zero wysyłki na stronę
- **Live** — pełna procedura z aktualizacją strony

---

## 1. Cel produktu

Małe okno zastępujące cały techniczny workflow aktualizacji galerii.

| ❌ Fotograf nigdy nie używa | ✅ Zastąpione przez |
|-----------------------------|---------------------|
| PowerShell | NF Studio Tools |
| Git / GitHub Web | ⬆ Aktualizuj {Galeria} |
| Cloudflare panel | automatyczny krok procedury |
| Terminal | — |
| Ręczna edycja `gallery.json` | automatyczny krok procedury |

**To nie jest CMS. To nie jest panel administracyjny. To narzędzie aktualizacji portfolio.**

### Ekosystem

```
eNFOP              — CRM, centrum działalności (osobny produkt)
NF Studio Tools    — aktualizacja portfolio (osobny produkt)
noirframe.art      — strona
```

Dwa produkty. Jeden ekosystem. Bez mieszania repozytoriów.

---

## 2. Zakres v1.0

### W zakresie

- 3 galerie: **Wedding**, **Portrait**, **Real Estate**
- Wybór galerii, drag & drop zdjęć
- **Tryb Test** + **Tryb Live**
- Pipeline: JPG + WebP + miniatury + manifest
- Checklist postępu (§4.2)
- Pasek statusu (§4.4)
- Wskaźnik synchronizacji (§4.5)
- Historia aktualizacji (biznesowa)
- **Przywróć poprzednią wersję** (§10)
- Kreator pierwszego uruchomienia — raz, nigdy więcej (§8)

### Poza zakresem v1.0

- Sekcja Portfolio na stronie (osobny moduł)
- Mission Control, zakładki, ustawienia
- Logowanie, CMS, SEO, blog, social media
- Integracja z eNFOP (v1.2+)
- Staging branch, preview URL

---

## 3. Mapowanie na infrastrukturę

| UI | Folder w repo | URL |
|----|---------------|-----|
| Wedding | `images/weddings/` | `#weddings` |
| Portrait | `images/portrait/` | `#portrait` |
| Real Estate | `images/realestate/` | `#realestate` |

### Pliki per zdjęcie

```
foto01.jpg          ← fallback dla strony
foto01.webp         ← gotowe na przyszłość
foto01_thumb.jpg    ← miniatura
```

NF Studio Tools myśli o **najlepszym materiale**, nie o tym, co strona dziś wyświetla.

### Manifest `gallery.json` (v1.0)

```json
{
  "images": ["foto01.jpg", "foto02.jpg"]
}
```

Pliki `.webp` commitowane obok JPG. Za pół roku — zmiana manifestu, materiały gotowe.

---

## 4. Ekrany UI

### 4.1 Ekran główny

```
NOIRFRAME
Studio Tools
────────────────────────────
Wedding      (6 zdjęć)
Portrait     (14 zdjęć)    ← aktywna
Real Estate  (5 zdjęć)
────────────────────────────
📁 Dodaj zdjęcia

  ○ Test          ○ Live
  ⬆ Aktualizuj Portrait
────────────────────────────
Status
🟢 Gotowe
────────────────────────────
Noir Frame Studio Tools · Ready.

Ostatnia synchronizacja · 26.07.2026 · 22:41 · ✔ Portfolio zsynchronizowane
```

**Przycisk główny:**
- Etykieta dynamiczna: **⬆ Aktualizuj {nazwa galerii}** (np. Portrait, Wedding)
- Aktywny gdy wybrana galeria ma niezsynchronizowane zmiany
- Słowo **„Publikuj" nie istnieje** w całym programie

**Tryb Test / Live:**
- **Test** = „Sprawdź" — kroki 1–3, bez wysyłki
- **Live** = pełna procedura
- Domyślnie: **Live**

**Czego nie ma:** menu, zakładek, ustawień, Git, Cloudflare, rollback, publikuj.

### 4.2 Overlay aktualizacji

**Tryb Live:**

```
📷  Analiza zdjęć          ✓ Portrait · 14 zdjęć
🖼  Przygotowanie           ✓ Miniatury · WebP
📋  Aktualizacja galerii    ✓
🌐  Aktualizacja strony     ✓
☁   Odświeżanie             ✓
✔   Gotowe

https://noirframe.art
```

**Tryb Test:**

```
📷  Analiza zdjęć          ✓ Portrait · 14 zdjęć
🖼  Przygotowanie           ✓ Miniatury · WebP
📋  Aktualizacja galerii    ✓
✔   Wszystko gotowe.

Strona nie została zmieniona.
```

Kroki wysyłki **nie istnieją** w trybie Test — nie „skipped", po prostu ich nie ma.

### 4.3 Historia

```
Historia
────────────────────────────
26.07   Portrait
        +3 zdjęcia
        ✔ Zaktualizowano
        [ Przywróć ]

24.07   Portrait
        +5 zdjęć
        ✔ Zaktualizowano
        [ Przywróć ]
```

**Słownik UI:**

| ✅ Używaj | ❌ Nigdy |
|----------|---------|
| Aktualizuj | Publikuj |
| Zaktualizowano | Opublikowano / Commit / Push |
| Przywróć | Rollback / Revert |
| Poprzednia wersja | SHA / Branch / Deploy |

### 4.4 Pasek statusu

| Stan | Tekst |
|------|-------|
| Idle | `Noir Frame Studio Tools · Ready.` |
| Dodawanie | `Dodaję zdjęcia do Portrait…` |
| Przygotowanie | `Przygotowuję zdjęcia…` |
| Galeria | `Aktualizuję galerię…` |
| Wysyłka | `Aktualizuję stronę…` |
| Odświeżanie | `Odświeżam stronę…` |
| Test OK | `✔ Wszystko gotowe. Strona nie została zmieniona.` |
| Live OK | `✔ Portrait zostało zaktualizowane.` |
| Przywracanie | `Przywracam poprzednią wersję Portrait…` |
| Błąd | `Coś poszło nie tak. Sprawdź komunikat powyżej.` |

### 4.5 Wskaźnik synchronizacji

Mały druk pod paskiem statusu. Zawsze widoczny.

```
Ostatnia synchronizacja · 26.07.2026 · 22:41 · ✔ Portfolio zsynchronizowane
```

**Znaczenie dla fotografa:** lokalny stan = stan strony. Wszystko zielone → idziesz robić zdjęcia.

**Co to oznacza wewnętrznie:** draft galerii = live-cache = weryfikacja HTTP na `noirframe.art`.  
**Czego tu nie ma:** GitHub, Git, repo, commit — zgodnie z Zasadą niewidzialności.  
Spokój bez technologii.

| Stan | Tekst |
|------|-------|
| Zsynchronizowane | `✔ Portfolio zsynchronizowane` |
| Oczekujące zmiany | `● Portrait · 2 niezsynchronizowane zdjęcia` |
| Sprawdzanie | `Sprawdzam synchronizację…` |
| Błąd sync | `● Nie udało się sprawdzić strony` |

Sync przy starcie aplikacji (cichy) i po każdej udanej aktualizacji Live.

---

## 5. Tryb Test

Przed dużą aktualizacją fotograf wybiera **Test** — numeracja, manifest, miniatury — **bez dotykania strony**.

| # | Krok | Test | Live |
|---|------|------|------|
| 1 | Analiza | ✅ | ✅ |
| 2 | Przygotowanie | ✅ | ✅ |
| 3 | Galeria | ✅ | ✅ |
| 4 | Aktualizacja strony | — | ✅ |
| 5 | Odświeżanie | — | ✅ |
| 6 | Weryfikacja | — | ✅ |

Wynik Test: *„✔ Wszystko gotowe. Strona nie została zmieniona."*

---

## 6. Pipeline Live

| # | UI | Wewnętrznie | Przy błędzie |
|---|-----|-------------|--------------|
| 1 | Analiza zdjęć | Walidacja | Stop |
| 2 | Przygotowanie | JPG + WebP + thumb | Cofnij pliki |
| 3 | Aktualizacja galerii | manifest + snapshot | Przywróć snapshot |
| 4 | Aktualizacja strony | GitHub API | Stop jeśli 1–3 fail |
| 5 | Odświeżanie | Pages poll + CF purge | Przywróć + komunikat |
| 6 | Weryfikacja | HTTP GET live | Auto-przywróć |
| 7 | Gotowe | Historia + sync | — |

Krok 4 dopiero po 1–3. Krok 6 przed *Zaktualizowano*.

---

## 7. Architektura techniczna

### Stack — Tauri 2 ✅

```
NF Studio Tools.exe
├── UI          — decyzje fotografa
└── Engine (Rust) — konsekwencje techniczne (niewidoczne)
```

Repo: `nf-studio-tools` · osobne od `noirframe.art` i eNFOP.

---

## 8. Kreator pierwszego uruchomienia

**Raz. Koniec. Nigdy więcej.**

```
Brak konfiguracji → Kreator (3 kroki) → Tokeny → ✓ → Główne okno
```

Krok 1: „Połączenie ze stroną"  
Krok 2: „Odświeżanie strony"  
Krok 3: „Gotowe"

Bez okna ustawień. Rotacja: `--reconfigure` (ukryte).

---

## 9. Tokeny

Windows Credential Manager. Nigdy w plikach. Setup tylko w kreatorze.

---

## 10. Przywróć poprzednią wersję

> *Rollback* istnieje tylko w kodzie. W UI: **[ Przywróć ]**.

Snapshot przed każdą aktualizacją Live → klik Przywróć → procedura Live ze snapshotu → *„✔ Portrait zostało zaktualizowane."*

Auto-przywracanie gdy weryfikacja live fail po wysyłce.

---

## 11. Obsługa błędów

Komunikaty po polsku. Zero jargonu. Fail-fast.

| Wewnętrznie | Dla fotografa |
|-------------|---------------|
| verify 404 | „Aktualizacja nieudana. Przywrócono poprzednią wersję." |
| auth fail | „Brak połączenia ze stroną." |

---

## 12–14. Historia, workspace, config

Bez zmian technicznych względem poprzedniej wersji spec.  
Historia używa statusu `updated` (nie `published`) w warstwie produktowej.

---

## 15. Poza tym dokumentem

Implementacja może ewoluować w kodzie. **Ten dokument — nie.**

Przyszłe moduły (eNFOP, Mission Control, blog, backup) — jeśli kiedykolwiek — wymagają **nowego dokumentu**, nie dopisywania do NFPM-001.

---
## 16. Wymagania — Zasada 90 sekund

| Wymaganie | Wartość |
|-----------|---------|
| **Rutynowa aktualizacja (1–5 zdjęć)** | **< 90 s** (cel projektowy) |
| Aktualizacja 20 zdjęć | < 3 min (limit techniczny) |
| Kliknięcia do aktualizacji | **≤ 3** (wybór galerii → dodaj → aktualizuj) |
| Okna dialogowe | **0** w rutynowym flow |
| Platforma | Windows 10/11 x64 |
| Język UI | Polski |

Jeśli rutynowa aktualizacja przekracza 90 s lub wymaga więcej niż 3 kliknięć — **regresja projektowa**, nie tylko wydajnościowa.

---

## 17. Zależności infrastrukturalne

Live wymaga INFRA-003 (Fazy 3–4). Test działa lokalnie bez tego.

---

## 18. Definition of Done — v1.0

**Kryterium sukcesu (PO):**

> Za pół roku: trzy nowe zdjęcia w minutę, zero PowerShell / GitHub / Cloudflare.

Checklist:

- [ ] `NF Studio Tools.exe`
- [ ] Kreator (raz)
- [ ] 3 galerie, drag & drop
- [ ] ⬆ Aktualizuj {Galeria} — **bez słowa „Publikuj"**
- [ ] Test + Live
- [ ] JPG + WebP + thumbs
- [ ] Checklist + pasek + wskaźnik synchronizacji
- [ ] Historia + Przywróć
- [ ] Rutynowa aktualizacja **< 90 s**
- [ ] E2E: Test +3 → Live +3 → Przywróć

---

## 19. Decyzje PO — zatwierdzone

| Decyzja | Status |
|---------|--------|
| Tauri 2 | ✅ |
| Osobne repo | ✅ |
| Credential Manager + kreator raz | ✅ |
| WebP od początku | ✅ |
| Przywróć (nie rollback) | ✅ |
| Tryb Test | ✅ |
| Pasek statusu | ✅ |
| **Aktualizuj (nie Publikuj)** | ✅ |
| **Zasada 90 sekund** | ✅ |
| **Zasada niewidzialności** | ✅ |
| **Wskaźnik synchronizacji** | ✅ |

---

## 20. Słownik produktu

| Warstwa | Dozwolone |
|---------|-----------|
| **UI** | Aktualizuj, Zaktualizowano, Test, Live, Przywróć, Gotowe, Zsynchronizowane |
| **Kod / spec techniczna** | publish, commit, pipeline, snapshot, restore |
| **Zakazane w UI** | Publikuj, Git, commit, push, SHA, branch, rollback, deploy, purge, GitHub, Cloudflare |

---

## 21. Test zgodności z Product Principles

Przed każdym release kandydat na nowy element UI musi przejść test:

1. **Czy to decyzja fotografa?** (tak → OK / nie → odrzuć)
2. **Czy wymaga wiedzy technicznej?** (tak → odrzuć)
3. **Czy dodaje kliknięcie do rutynowego flow?** (tak → uzasadnij lub odrzuć)
4. **Czy mieści się w 90 sekundach?** (nie → redesign)

Przykłady:

| Propozycja | Werdykt |
|------------|---------|
| Przycisk „Commit" | ❌ operacja techniczna |
| Przycisk „Purge Cache" | ❌ operacja techniczna |
| ⬆ Aktualizuj Portrait | ✅ decyzja fotografa |
| ○ Test przed aktualizacją | ✅ decyzja fotografa |
| Okno konfiguracji tokenów | ❌ (tylko kreator raz) |
| Ustawienia, profile, AI, SEO, blog | ❌ — poza zamrożonym dokumentem |

---

## 22. Definition of Success

Projekt uznaje się za **ukończony**, jeżeli fotograf, który **nie pamięta nic** z migracji DNS, potrafi po **sześciu miesiącach przerwy**:

1. uruchomić program,
2. dodać trzy zdjęcia,
3. zaktualizować stronę,

**nie korzystając z żadnej instrukcji.**

Jeżeli potrzebna jest instrukcja — **projekt nie jest skończony.**

Ten test nie sprawdza kodu. **Sprawdza UX.**

---

## 23. Test piątku przed ślubem

Nie budujcie idealnego programu. Budujcie program, **którego nie będziecie bali się używać przed wyjazdem na ślub.**

```
Piątek · 8:00 · godzina do wyjazdu
Klient: „Można dodać trzy zdjęcia do portfolio?"
```

Bez stresu: uruchamiasz NF Studio Tools → ⬆ Aktualizuj Portrait → minuta → zamykasz program → jedziesz.

**Jeżeli wtedy wygraliście — wygraliście naprawdę.**

To inny cel niż „feature complete". To cel **zaufania**.

---

## 24. Reszta może poczekać

> **Reszta może poczekać.**

To nie komentarz. To **przypomnienie** dla każdego, kto otworzy ten dokument za miesiąc, rok albo pięć lat.

NF Studio Tools v1.0 ma wszystko, czego potrzebuje, żeby rozwiązać **jeden konkretny problem**: żeby fotograf nie musiał drugi raz przejść przez dzień taki jak dzisiejszy.

Na początku dnia: DNS, Netcup, Cloudflare, GitHub Pages, GitHub, PowerShell.  
Wieczorem: **⬆ Aktualizuj Portrait**.

Cała ta technologia zamknięta w jednym przycisku. **To wystarczy.**

---

## 25. Podpis dokumentu

| Pole | Wartość |
|------|---------|
| Dokument | NFPM-001 |
| Produkt | NF Studio Tools |
| Stan | 🔒 FROZEN |
| Data | 2026-07-26 |
| Jedno zdanie | Aktualizacja portfolio prostsza niż dodanie zdjęć do Facebooka |
| Jedno zadanie | Rule of One |
| Jeden test | Definition of Success (6 miesięcy, zero instrukcji) |

---

*NFPM-001 — spec only, no code. Dokument zamrożony. Nie dopisywać.*

