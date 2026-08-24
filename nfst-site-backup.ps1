<#
.SYNOPSIS
  NFST Site Backup - CREATE BACKUP | RESTORE BACKUP | CREATE SNAPSHOT

.DESCRIPTION
  Priorytet 0: pełna kopia plików strony noirframe.art bez node_modules, .git i backups/.
  Snapshot Git jest osobną operacją (commit lokalny, bez GitHub).

.EXAMPLE
  .\nfst-site-backup.ps1 -Action Backup

.EXAMPLE
  .\nfst-site-backup.ps1 -Action Restore -BackupName backup_2026-08-23_0135

.EXAMPLE
  .\nfst-site-backup.ps1 -Action Snapshot
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("Backup", "Restore", "Snapshot", "List")]
    [string]$Action,

    [string]$BackupName,

    [switch]$Force,

    [string]$RepoRoot
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
    $RepoRoot = $PSScriptRoot
}

$GitCandidates = @(
    "git",
    "C:\Program Files\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\GitHubDesktop\app-3.6.2\resources\app\git\cmd\git.exe"
)

function Get-GitExe {
    foreach ($candidate in $GitCandidates) {
        if ($candidate -eq "git") {
            $cmd = Get-Command git -ErrorAction SilentlyContinue
            if ($cmd) { return $cmd.Source }
            continue
        }
        if (Test-Path $candidate) { return $candidate }
    }
    return $null
}

function Get-GitInfo {
    param([string]$Root)

    $git = Get-GitExe
    if (-not $git) {
        return @{ commit = ""; branch = "" }
    }

    $commit = ""
    $branch = ""
    try {
        $commit = & $git -C $Root rev-parse --short HEAD 2>$null
        $branch = & $git -C $Root rev-parse --abbrev-ref HEAD 2>$null
    } catch {
        # repo bez git lub brak commitów
    }

    return @{
        commit = if ($commit) { $commit.Trim() } else { "" }
        branch = if ($branch) { $branch.Trim() } else { "" }
    }
}

function Test-ExcludedPath {
    param(
        [string]$RelativePath,
        [string[]]$ExcludeDirs
    )

    $normalized = $RelativePath -replace '\\', '/'
    foreach ($dir in $ExcludeDirs) {
        $pattern = ($dir.Trim('/') + '/')
        if ($normalized -eq $dir.Trim('/') -or $normalized.StartsWith($pattern)) {
            return $true
        }
    }
    return $false
}

function Get-BackupExcludeDirs {
    return @('node_modules', '.git', 'backups')
}

function New-BackupFolderName {
    return "backup_{0:yyyy-MM-dd_HHmm}" -f (Get-Date)
}

function Invoke-SiteBackup {
    param([string]$Root)

    $excludeDirs = Get-BackupExcludeDirs
    $backupsRoot = Join-Path $Root "backups"
    $folderName = New-BackupFolderName
    $dest = Join-Path $backupsRoot $folderName

    if (Test-Path $dest) {
        throw "Folder backupu juz istnieje: $dest"
    }

    New-Item -ItemType Directory -Path $dest -Force | Out-Null

    $files = Get-ChildItem -Path $Root -Recurse -File -Force |
        Where-Object {
            $rel = $_.FullName.Substring($Root.Length).TrimStart('\', '/')
            -not (Test-ExcludedPath -RelativePath $rel -ExcludeDirs $excludeDirs)
        }

    foreach ($file in $files) {
        $relative = $file.FullName.Substring($Root.Length).TrimStart('\', '/')
        $target = Join-Path $dest $relative
        $targetDir = Split-Path $target -Parent
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        Copy-Item -Path $file.FullName -Destination $target -Force
    }

    $gitInfo = Get-GitInfo -Root $Root
    $totalBytes = ($files | Measure-Object -Property Length -Sum).Sum
    $manifest = [ordered]@{
        date   = (Get-Date).ToString("o")
        commit = $gitInfo.commit
        branch = $gitInfo.branch
        files  = $files.Count
        bytes  = [int64]$totalBytes
        source = (Resolve-Path $Root).Path
        action = "backup"
    }

    $manifestPath = Join-Path $dest "backup_manifest.json"
    ($manifest | ConvertTo-Json -Depth 4) + "`n" |
        Set-Content -Path $manifestPath -Encoding UTF8

    [PSCustomObject]@{
        BackupPath   = $dest
        BackupName   = $folderName
        Files        = $files.Count
        SizeMB       = [math]::Round($totalBytes / 1MB, 2)
        Commit       = $gitInfo.commit
        Branch       = $gitInfo.branch
        ManifestPath = $manifestPath
    }
}

function Get-AvailableBackups {
    param([string]$Root)

    $backupsRoot = Join-Path $Root "backups"
    if (-not (Test-Path $backupsRoot)) {
        return @()
    }

    Get-ChildItem -Path $backupsRoot -Directory |
        Where-Object { $_.Name -match '^backup_\d{4}-\d{2}-\d{2}_\d{4}$' } |
        Sort-Object Name -Descending
}

function Invoke-SiteRestore {
    param(
        [string]$Root,
        [string]$Name,
        [switch]$ForceRestore
    )

    $backups = Get-AvailableBackups -Root $Root
    if ($backups.Count -eq 0) {
        throw "Brak backupow w $(Join-Path $Root 'backups')"
    }

    $selected = if ($Name) {
        $match = $backups | Where-Object { $_.Name -eq $Name } | Select-Object -First 1
        if (-not $match) {
            throw "Nie znaleziono backupu: $Name"
        }
        $match
    } else {
        $backups | Select-Object -First 1
    }

    if (-not $ForceRestore) {
        $answer = Read-Host "Przywrocic backup '$($selected.Name)' nad biezaca strone? (t/N)"
        if ($answer -notin @('t', 'T', 'y', 'Y')) {
            Write-Host "Anulowano."
            return
        }
    }

    Write-Host "Tworze kopie bezpieczenstwa przed restore..."
    $preRestore = Invoke-SiteBackup -Root $Root
    Write-Host "Pre-restore backup: $($preRestore.BackupName)"

    $excludeDirs = Get-BackupExcludeDirs
    $source = $selected.FullName
    $restoreFiles = Get-ChildItem -Path $source -Recurse -File -Force |
        Where-Object { $_.Name -ne 'backup_manifest.json' }

    foreach ($file in $restoreFiles) {
        $relative = $file.FullName.Substring($source.Length).TrimStart('\', '/')
        if (Test-ExcludedPath -RelativePath $relative -ExcludeDirs $excludeDirs) {
            continue
        }

        $target = Join-Path $Root $relative
        $targetDir = Split-Path $target -Parent
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        Copy-Item -Path $file.FullName -Destination $target -Force
    }

    [PSCustomObject]@{
        RestoredFrom = $selected.Name
        Files        = $restoreFiles.Count
        PreRestore   = $preRestore.BackupName
    }
}

function Invoke-GitSnapshot {
    param([string]$Root)

    $git = Get-GitExe
    if (-not $git) {
        throw "Nie znaleziono git.exe - snapshot niemozliwy."
    }

    if (-not (Test-Path (Join-Path $Root ".git"))) {
        throw "Brak repozytorium Git w: $Root"
    }

    & $git -C $Root add .
    $status = & $git -C $Root status --porcelain
    if (-not $status) {
        Write-Host "Brak zmian - snapshot pominietty."
        return [PSCustomObject]@{
            Created = $false
            Message = "Brak zmian"
        }
    }

    $message = "NFST Snapshot"
    & $git -C $Root commit -m $message | Out-Host
    $info = Get-GitInfo -Root $Root

    [PSCustomObject]@{
        Created = $true
        Commit  = $info.commit
        Branch  = $info.branch
        Message = $message
    }
}

if (-not (Test-Path $RepoRoot)) {
    throw "Nie znaleziono katalogu projektu: $RepoRoot"
}

switch ($Action) {
    "Backup" {
        $result = Invoke-SiteBackup -Root $RepoRoot
        Write-Host ""
        Write-Host "CREATE BACKUP - gotowe"
        Write-Host "  Folder : $($result.BackupPath)"
        Write-Host "  Pliki  : $($result.Files)"
        Write-Host "  Rozmiar: $($result.SizeMB) MB"
        Write-Host ('  Git    : {0}@{1}' -f $result.Branch, $result.Commit)
        Write-Host "  Manifest: $($result.ManifestPath)"
    }
    "Restore" {
        $result = Invoke-SiteRestore -Root $RepoRoot -Name $BackupName -ForceRestore:$Force
        if ($result) {
            Write-Host ""
            Write-Host "RESTORE BACKUP - gotowe"
            Write-Host "  Przywrocono : $($result.RestoredFrom)"
            Write-Host "  Pliki       : $($result.Files)"
            Write-Host "  Kopia przed : $($result.PreRestore)"
        }
    }
    "Snapshot" {
        $result = Invoke-GitSnapshot -Root $RepoRoot
        Write-Host ""
        Write-Host "CREATE SNAPSHOT - gotowe"
        if ($result.Created) {
            Write-Host "  Commit : $($result.Commit)"
            Write-Host "  Branch : $($result.Branch)"
            Write-Host "  Opis   : $($result.Message)"
        } else {
            Write-Host "  $($result.Message)"
        }
    }
    "List" {
        $items = Get-AvailableBackups -Root $RepoRoot
        if ($items.Count -eq 0) {
            Write-Host "Brak backupow."
            return
        }
        foreach ($item in $items) {
            $manifestPath = Join-Path $item.FullName "backup_manifest.json"
            $meta = ""
            if (Test-Path $manifestPath) {
                $json = Get-Content $manifestPath -Raw | ConvertFrom-Json
                $meta = (' | {0} plikow | {1}@{2}' -f $json.files, $json.branch, $json.commit)
            }
            Write-Host "$($item.Name)$meta"
        }
    }
}
