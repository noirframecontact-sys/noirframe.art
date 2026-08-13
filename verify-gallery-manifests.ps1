$ErrorActionPreference = "Stop"

$imagesRoot = Join-Path $PSScriptRoot "images"
$galleryFolders = @("weddings", "portrait", "realestate")
$imageExtensions = @(".jpg", ".jpeg", ".webp", ".avif")
$failed = $false

function Get-ExpectedImages($dir) {
    return @(Get-ChildItem -Path $dir -File |
        Where-Object { $imageExtensions -contains $_.Extension.ToLower() } |
        Sort-Object {
            if ($_.BaseName -match '^foto(\d+)$') {
                [int]$Matches[1]
            } else {
                [int]::MaxValue
            }
        }, Name |
        ForEach-Object { $_.Name })
}

foreach ($folder in $galleryFolders) {
    $dir = Join-Path $imagesRoot $folder
    $manifestPath = Join-Path $dir "gallery.json"

    if (-not (Test-Path $manifestPath)) {
        Write-Error "Missing manifest: $manifestPath"
    }

    $expected = Get-ExpectedImages $dir
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $actual = @($manifest.images)

    $missingInManifest = @($expected | Where-Object { $_ -notin $actual })
    $extraInManifest = @($actual | Where-Object { $_ -notin $expected })

    if ($missingInManifest.Count -gt 0 -or $extraInManifest.Count -gt 0) {
        $failed = $true
        Write-Host "FAIL $folder" -ForegroundColor Red
        if ($missingInManifest.Count -gt 0) {
            Write-Host "  missing in gallery.json: $($missingInManifest -join ', ')"
        }
        if ($extraInManifest.Count -gt 0) {
            Write-Host "  extra in gallery.json: $($extraInManifest -join ', ')"
        }
        continue
    }

    Write-Host "OK $folder ($($actual.Count) images)" -ForegroundColor Green
}

if ($failed) {
    Write-Host "`nRun .\sync-gallery-manifests.ps1 and commit gallery.json" -ForegroundColor Yellow
    exit 1
}

exit 0
