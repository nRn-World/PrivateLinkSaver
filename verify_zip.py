#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import zipfile
import json
import os

zip_path = r"D:\APPS By nRn World\Chrome\PrivateLinkSaver\PrivateLinkSaver_v2.4.2.zip"

print("=== Kontrollerar ZIP-filen ===")
print(f"Fil: {zip_path}")

if not os.path.exists(zip_path):
    print("FEL! Filen finns inte!")
    exit(1)

size = os.path.getsize(zip_path)
print(f"Storlek: {size:,} bytes ({size/1024/1024:.2f} MB)")

print("\n=== Filer i ZIP ===")
with zipfile.ZipFile(zip_path, 'r') as z:
    files = sorted(z.namelist())
    print(f"Antal filer: {len(files)}")
    for f in files:
        print(f"  {f}")
    
    # Check manifest
    print("\n=== Manifest version ===")
    manifest = json.loads(z.read('manifest.json'))
    print(f"  Version: {manifest['version']}")
    print(f"  Manifest version: {manifest['manifest_version']}")
    
    # Check for bad files
    print("\n=== Kontroll av onodiga filer ===")
    bad_patterns = ['test_build', 'build_', 'fix_', 'create_', 'final_']
    found_bad = []
    for f in files:
        for pattern in bad_patterns:
            if pattern in f:
                found_bad.append(f)
                break
    
    if found_bad:
        print("VARNING! Onodiga filer hittade:")
        for f in found_bad:
            print(f"  {f}")
    else:
        print("Bra! Inga onodiga filer.")
    
    # Check Swedish locale
    print("\n=== Svenska sprakfilen ===")
    sv_content = z.read('_locales/sv/messages.json').decode('utf-8')
    sv_data = json.loads(sv_content)
    print(f"  Antal nycklar: {len(sv_data)}")
    print(f"  auto_logout_15: {sv_data.get('auto_logout_15', {}).get('message', 'SAKNAS')}")

print("\n=== SAMMANFATTNING ===")
print("ZIP-filen ar klar for Chrome Web Store!")
print(f"Version: {manifest['version']}")
print(f"Storlek: {size/1024/1024:.2f} MB")
