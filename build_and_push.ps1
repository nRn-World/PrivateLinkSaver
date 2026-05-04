# PrivateLinkSaver v2.5.0 - Build ZIP + Push to GitHub
# Run this script from: D:\APPS By nRn World\Chrome\PrivateLinkSaver

$src = "D:\APPS By nRn World\Chrome\PrivateLinkSaver"
$version = "2.5.0"
$zipPath = "$src\PrivateLinkSaver_v$version.zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " PrivateLinkSaver v$version Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ---- 1. Create ZIP ----
Write-Host "`n[1/3] Creating ZIP for Chrome Web Store..." -ForegroundColor Yellow

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Add-Type -Assembly System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

$include = @("manifest.json", "popup.html", "options.html", "icons", "scripts", "styles", "vendor", "_locales")

foreach ($item in $include) {
    $fullPath = Join-Path $src $item
    if (Test-Path $fullPath -PathType Leaf) {
        $entry = $zip.CreateEntry($item)
        $s = $entry.Open()
        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        $s.Write($bytes, 0, $bytes.Length)
        $s.Close()
    } elseif (Test-Path $fullPath -PathType Container) {
        $files = Get-ChildItem -Path $fullPath -Recurse -File
        foreach ($file in $files) {
            $rel = $file.FullName.Substring($src.Length + 1).Replace('\','/')
            $entry = $zip.CreateEntry($rel)
            $s = $entry.Open()
            $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
            $s.Write($bytes, 0, $bytes.Length)
            $s.Close()
        }
    }
}
$zip.Dispose()

$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "  ZIP created: $zipPath ($sizeMB MB)" -ForegroundColor Green

# ---- 2. Git commit ----
Write-Host "`n[2/3] Committing changes to Git..." -ForegroundColor Yellow

Set-Location $src

git add -A
git commit -m "v$version - Fix Cloud Sync, Auto Logout, Badge, Version display

Changes:
- Fixed Cloud Sync: login, logout, sync, save backup, download backup all work
- Fixed Firebase auth persistence (session survives page reload)
- Fixed all Firebase REST API calls to include API key
- Fixed Auto Logout: session activity tracking + periodic 30s check in popup
- Removed badge count from extension icon (always blank now)
- Added version display in Settings (General Settings card)
- Added version display in Settings footer
- Added version display in popup footer
- Bumped version to $version"

# ---- 3. Git push ----
Write-Host "`n[3/3] Pushing to GitHub..." -ForegroundColor Yellow

git push origin main

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " DONE! v$version built and pushed!" -ForegroundColor Green
Write-Host " ZIP: $zipPath" -ForegroundColor Green
Write-Host " Upload the ZIP to Chrome Web Store." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
