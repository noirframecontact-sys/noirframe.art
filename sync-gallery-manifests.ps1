$ErrorActionPreference = "Stop"

$imagesRoot = Join-Path $PSScriptRoot "images"
$galleryFolders = @("weddings", "portrait", "realestate")
$imageExtensions = @(".jpg", ".jpeg", ".webp", ".avif")

foreach ($folder in $galleryFolders) {
    $dir = Join-Path $imagesRoot $folder
    if (-not (Test-Path $dir)) {
        Write-Warning "Skipping missing folder: $dir"
        continue
    }

    $images = Get-ChildItem -Path $dir -File |
        Where-Object { $imageExtensions -contains $_.Extension.ToLower() } |
        Sort-Object {
            if ($_.BaseName -match '^foto(\d+)$') {
                [int]$Matches[1]
            } else {
                [int]::MaxValue
            }
        }, Name |
        ForEach-Object { $_.Name }

    $manifest = @{
        images = @($images)
    } | ConvertTo-Json -Depth 3

    $manifestPath = Join-Path $dir "gallery.json"
    [System.IO.File]::WriteAllText($manifestPath, $manifest + "`n", [System.Text.UTF8Encoding]::new($false))
    Write-Host "$folder`: $($images.Count) image(s) -> $manifestPath"
}
