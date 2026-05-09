#!/usr/bin/env python3
"""
Build script for PrivateLinkSaver v2.4.5
Creates a clean ZIP for Chrome Web Store upload
"""
import zipfile
import os
import re

BASE_DIR = r"D:\APPS By nRn World\Chrome\PrivateLinkSaver"
OUTPUT_ZIP = os.path.join(BASE_DIR, "PrivateLinkSaver_2.4.5.zip")

# Files/folders to EXCLUDE from the ZIP
EXCLUDE_PATTERNS = [
    ".git",
    ".gitignore",
    ".vscode",
    "__pycache__",
    "build_",
    "verify_zip",
    "final_build",
    "create_sv",
    "create_swedish",
    "fix_sv",
    "fix_swedish",
    "requirements.md",
    "MANIFEST_V3_FIX.md",
    "PRIVACY.md",
    "README.md",
    "Screenshot",
    "WebStore_Assets",
    "dev_assets",
    "docs",
    "marketing_assets",
    "test_build",
    ".zip",
]

def should_exclude(path):
    name = os.path.basename(path)
    for pattern in EXCLUDE_PATTERNS:
        if pattern in name or name.endswith(pattern):
            return True
    return False

print("\n📦 Building ZIP: {OUTPUT_ZIP}")

file_count = 0
with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for root, dirs, files in os.walk(BASE_DIR):
        # Remove excluded dirs in-place
        dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d))]
        
        for file in files:
            filepath = os.path.join(root, file)
            if should_exclude(filepath):
                continue
            arcname = os.path.relpath(filepath, BASE_DIR)
            zf.write(filepath, arcname)
            file_count += 1
            print(f"   + {arcname}")

size_kb = os.path.getsize(OUTPUT_ZIP) / 1024
print(f"\n✅ ZIP skapad: {OUTPUT_ZIP}")
print(f"   Filer: {file_count}")
print(f"   Storlek: {size_kb:.0f} KB")
print(f"\n🚀 Klar att ladda upp på Chrome Web Store!")
