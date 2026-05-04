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

# Check firebase-auth-compat.js for bad URLs first
bad_urls = [
    "https://apis.google.com/js/api.js",
    "https://www.google.com/recaptcha/api.js",
    "https://www.google.com/recaptcha/enterprise.js",
]

auth_file = os.path.join(BASE_DIR, "scripts", "firebase-auth-compat.js")
with open(auth_file, "r", encoding="utf-8") as f:
    auth_content = f.read()

found_bad = []
for url in bad_urls:
    if url in auth_content:
        found_bad.append(url)

if found_bad:
    print("⚠️  WARNING - Bad URLs still found in firebase-auth-compat.js:")
    for url in found_bad:
        print(f"   {url}")
    print("\n   Fixing now...")
    auth_content = auth_content.replace(
        "https://apis.google.com/js/api.js",
        "disabled://apis.google.com/js/api.js"
    )
    auth_content = auth_content.replace(
        "https://www.google.com/recaptcha/api.js",
        "disabled://www.google.com/recaptcha/api.js"
    )
    auth_content = auth_content.replace(
        "https://www.google.com/recaptcha/enterprise.js?render=",
        "disabled://www.google.com/recaptcha/enterprise.js?render="
    )
    with open(auth_file, "w", encoding="utf-8") as f:
        f.write(auth_content)
    print("   ✅ Fixed!")
else:
    print("✅ firebase-auth-compat.js: No bad external URLs found!")

# Check other firebase files too
for fname in ["firebase-app-compat.js", "firebase-firestore-compat.js"]:
    fpath = os.path.join(BASE_DIR, "scripts", fname)
    if os.path.exists(fpath):
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        found = [u for u in bad_urls if u in content]
        if found:
            print(f"⚠️  Fixing {fname}...")
            for url in found:
                content = content.replace(url, "disabled://" + url[8:])
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"   ✅ Fixed {fname}!")
        else:
            print(f"✅ {fname}: OK")

print(f"\n📦 Building ZIP: {OUTPUT_ZIP}")

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
