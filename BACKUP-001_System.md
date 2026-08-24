# BACKUP-001 — System backupu noirframe.art

**Status:** aktywny (Priorytet 0)  
**Data:** 2026-08-24  
**Skrypt:** `nfst-site-backup.ps1`

---

## Cel

Jednym poleceniem tworzyć pełną kopię strony **bez GitHub** — niezależnie od publikacji i pipeline.

Dwa niezależne mechanizmy:

| Przycisk (NFST) | Mechanizm | Co robi |
|-----------------|-----------|---------|
| **CREATE BACKUP** | kopia plików | Folder `backups/backup_YYYY-MM-DD_HHMM/` |
| **CREATE SNAPSHOT** | Git lokalny | `git add .` + commit `NFST Snapshot` |
| **RESTORE BACKUP** | kopia plików | Przywraca wybrany backup nad repo |

---

## Zakres backupu plikowego

Kopiowane jest **całe repo** z wyjątkiem:

- `node_modules/`
- `.git/`
- `backups/` (brak rekursji)

W praktyce obejmuje m.in.:

- `index.html`, `script.js`
- `website/` (CSS, JS)
- `data/` (blog, aktuell, angebote)
- `images/` + manifesty galerii (`gallery.json`, `motion.json`)
- `FONTY/` (ikony Phosphor lokalne)
- `media/`, `Dark_Side/`
- dokumentacja, skrypty pomocnicze (`.ps1`, `.md`)

Fonty Google (Inter) są ładowane z CDN — nie wymagają kopii lokalnej.

---

## Użycie (PowerShell)

```powershell
cd D:\Projects\NOIRFRAME-WEDDING\noirframe.art

# CREATE BACKUP
.\nfst-site-backup.ps1 -Action Backup

# Lista backupów
.\nfst-site-backup.ps1 -Action List

# RESTORE BACKUP (najnowszy, z potwierdzeniem)
.\nfst-site-backup.ps1 -Action Restore

# RESTORE konkretny backup
.\nfst-site-backup.ps1 -Action Restore -BackupName backup_2026-08-24_0903

# RESTORE bez pytania (NFST / automatyzacja)
.\nfst-site-backup.ps1 -Action Restore -BackupName backup_2026-08-24_0903 -Force

# CREATE SNAPSHOT (Git, lokalnie)
.\nfst-site-backup.ps1 -Action Snapshot
```

---

## `backup_manifest.json`

Generowany w każdym folderze backupu:

```json
{
  "date": "2026-08-24T09:03:00+02:00",
  "commit": "bf6084e",
  "branch": "main",
  "files": 153,
  "bytes": 229556224,
  "source": "D:\\Projects\\NOIRFRAME-WEDDING\\noirframe.art",
  "action": "backup"
}
```

Pola `commit` i `branch` to stan Git **w momencie backupu** (informacyjnie). Sam backup nie zawiera historii Git.

---

## Przywracanie bez GitHub

1. **Automatycznie (skrypt):** `Restore` kopiuje pliki z wybranego `backups/backup_*` do root repo.
2. **Przed restore** skrypt tworzy dodatkowy backup bieżącego stanu (pre-restore safety net).
3. **Ręcznie:** skopiuj zawartość folderu backupu (pomijając `backup_manifest.json` jeśli chcesz) do root projektu.

Strona działa lokalnie od razu (otwórz `index.html` lub serwer statyczny).  
GitHub / Cloudflare **nie są wymagane** do odtworzenia plików.

---

## Szacunek miejsca

| Stan (2026-08-24) | Wartość |
|-------------------|---------|
| Projekt (bez `.git`) | ~219 MB |
| Liczba plików | ~153 |
| 1 backup | ~219 MB |
| 5 backupów | ~1,1 GB |
| 10 backupów | ~2,2 GB |

Dominują `images/` (~119 MB) i media wideo bloga.  
Katalog `backups/` jest w `.gitignore` — nie trafia na GitHub Pages.

---

## Integracja z NFST (v1.1+)

Planowane mapowanie w dolnym pasku panelu admin:

```
[ Rollback ]  [ CREATE BACKUP ]  [ CREATE SNAPSHOT ]  status repo
```

Implementacja Tauri (Rust):

```rust
// Wywołanie istniejącego skryptu — zero duplikacji logiki
Command::new("powershell")
    .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-Action", "Backup"])
```

Alternatywa docelowa: przenieść logikę do modułu `src-tauri/src/backup.rs` (ta sama lista exclude, ten sam manifest).

**CREATE BACKUP** — przed każdą większą edycją w NFST (Blog, Video, About).  
**CREATE SNAPSHOT** — punkt przywracania w Git (rollback przez `git reset` / `git checkout`).  
**RESTORE BACKUP** — awaryjne odtworzenie plików gdy Git nie wystarcza.

---

## Różnica: Backup vs Snapshot

| | CREATE BACKUP | CREATE SNAPSHOT |
|---|-------------|-----------------|
| Format | folder plików | commit Git |
| GitHub | nie potrzebny | nie potrzebny (lokalny commit) |
| Przywracanie | kopiowanie plików | `git checkout` / reset |
| Zawiera `.git` | nie | tak (historia w repo) |
| Offline | tak | tak |

Oba mechanizmy się uzupełniają — backup plikowy jest „pełnym zdjęciem strony”, snapshot jest lekki i śledzi zmiany tekstowe/JSON.

---

## Powiązane pliki

- `nfst-site-backup.ps1` — implementacja
- `GO_LIVE.md` — historyczny backup ręczny (2026-07-29)
- `NFPM-001` — filozofia „Przywróć” w NFST (osobny dokument, bez rozszerzania)
