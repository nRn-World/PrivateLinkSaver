# PrivateLinkSaver — Build ZIP for Chrome Web Store (+ optional Git push)
# Run from anywhere; paths resolve from this script's folder.

$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$manifest = Get-Content (Join-Path $src 'manifest.json') -Raw | ConvertFrom-Json
$version = $manifest.version
$zipPath = Join-Path $src "PrivateLinkSaver_v$version.zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " PrivateLinkSaver v$version Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ---- 1. Create ZIP (extension package only) ----
Write-Host "`n[1/3] Creating ZIP for Chrome Web Store..." -ForegroundColor Yellow

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Add-Type -AssemblyName System.IO.Compression.FileSystem

# Only ship runtime extension files — exclude marketing, screenshots, docs, nested zips, etc.
$include = @(
    'manifest.json',
    'popup.html',
    'options.html',
    'icons',
    'scripts',
    'styles',
    'vendor',
    '_locales'
)

$excludeNamePatterns = @(
    '*.zip',
    '*.md',
    '*.ps1',
    '.DS_Store',
    'Thumbs.db'
)

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

try {
    foreach ($item in $include) {
        $fullPath = Join-Path $src $item
        if (Test-Path $fullPath -PathType Leaf) {
            $entry = $zip.CreateEntry($item.Replace('\', '/'))
            $stream = $entry.Open()
            try {
                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $stream.Write($bytes, 0, $bytes.Length)
            } finally {
                $stream.Close()
            }
        } elseif (Test-Path $fullPath -PathType Container) {
            $files = Get-ChildItem -Path $fullPath -Recurse -File | Where-Object {
                $name = $_.Name
                -not ($excludeNamePatterns | Where-Object { $name -like $_ })
            }
            foreach ($file in $files) {
                $rel = $file.FullName.Substring($src.Length + 1).Replace('\', '/')
                $entry = $zip.CreateEntry($rel)
                $stream = $entry.Open()
                try {
                    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
                    $stream.Write($bytes, 0, $bytes.Length)
                } finally {
                    $stream.Close()
                }
            }
        } else {
            Write-Host "  Skip missing: $item" -ForegroundColor DarkYellow
        }
    }
} finally {
    $zip.Dispose()
}

$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "  ZIP created: $zipPath ($sizeMB MB)" -ForegroundColor Green
Write-Host "  Excluded from zip: marketing_assets, Screenshot, WebStore_Assets, docs, *.zip, *.md, scripts outside include list" -ForegroundColor DarkGray

# ---- 2. Git commit (optional — uncomment to auto-commit) ----
Write-Host "`n[2/3] Skipping git commit (run manually when ready)..." -ForegroundColor Yellow
Write-Host "  Hint: git add -A && git commit && git push" -ForegroundColor DarkGray

# ---- 3. Git push (optional) ----
Write-Host "`n[3/3] Skipping git push." -ForegroundColor Yellow

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " DONE! v$version ZIP ready." -ForegroundColor Green
Write-Host " ZIP: $zipPath" -ForegroundColor Green
Write-Host " Upload the ZIP to Chrome Web Store." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
