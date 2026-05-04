#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
import zipfile

# 1. Create proper Swedish locale file with correct characters
swedish_data = {
    "extName": {
        "message": "PrivateLinkSaver",
        "description": "Extension name"
    },
    "extDescription": {
        "message": "Spara och organisera dina länkar privat och säkert med lösenordsskydd",
        "description": "Extension description"
    },
    "cmdSavePage": {
        "message": "Spara aktuell sida till bokmärken",
        "description": "Save current page command"
    },
    "cmdOpenPopup": {
        "message": "Öppna PrivateLinkSaver popup",
        "description": "Open popup command"
    },
    "cmdQuickSearch": {
        "message": "Snabbsökning i bokmärken",
        "description": "Quick search command"
    },
    "contextSaveLink": {
        "message": "Spara länk till PrivateLinkSaver",
        "description": "Context menu save link"
    },
    "contextSavePage": {
        "message": "Spara sida till PrivateLinkSaver",
        "description": "Context menu save page"
    },
    "notificationSaved": {
        "message": "Sparad: $title$",
        "description": "Notification saved",
        "placeholders": {
            "title": {
                "content": "$1",
                "example": "Page Title"
            }
        }
    },
    "notificationExists": {
        "message": "Denna sida är redan sparad!",
        "description": "Notification already exists"
    },
    "notificationLoginRequired": {
        "message": "Vänligen logga in för att spara bokmärken",
        "description": "Notification login required"
    },
    "auto_logout_5": {
        "message": "5 minuter",
        "description": "Auto logout 5 minuter"
    },
    "auto_logout_15": {
        "message": "15 minuter",
        "description": "Auto logout 15 minuter"
    },
    "auto_logout_30": {
        "message": "30 minuter",
        "description": "Auto logout 30 minuter"
    },
    "auto_logout_60": {
        "message": "60 minuter",
        "description": "Auto logout 60 minuter"
    },
    "auto_logout_never": {
        "message": "Aldrig",
        "description": "Auto logout aldrig"
    }
}

# Write Swedish locale with UTF-8 (no BOM)
sv_path = r"D:\APPS By nRn World\Chrome\PrivateLinkSaver\_locales\sv\messages.json"
with open(sv_path, "w", encoding="utf-8") as f:
    json.dump(swedish_data, f, ensure_ascii=False, indent=2)
print("✓ Svenska språkfilen skapad med korrekta tecken (å, ä, ö)")

# Verify the file
with open(sv_path, "r", encoding="utf-8") as f:
    verified_data = json.load(f)
    print(f"✓ JSON validerad! Antal nycklar: {len(verified_data)}")
    print(f"  Test ExtDescription: {verified_data['extDescription']['message']}")

# 2. Create clean ZIP file for Chrome Web Store
base_path = r"D:\APPS By nRn World\Chrome\PrivateLinkSaver"
zip_path = os.path.join(base_path, "PrivateLinkSaver_v2.4.2.zip")

# Files and folders to include
include_items = [
    "icons",
    "scripts", 
    "styles",
    "vendor",
    "_locales",
    "manifest.json",
    "popup.html",
    "options.html",
    "README.md",
    "LICENSE",
    "PRIVACY.md"
]

# Remove old ZIP if exists
if os.path.exists(zip_path):
    os.remove(zip_path)
    print(f"✓ Tog bort gammal ZIP-fil")

# Create new ZIP
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for item in include_items:
        item_path = os.path.join(base_path, item)
        if os.path.isdir(item_path):
            for root, dirs, files in os.walk(item_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, base_path)
                    zipf.write(file_path, arcname)
        elif os.path.isfile(item_path):
            arcname = item
            zipf.write(item_path, arcname)

print(f"\n✓ ZIP-fil skapad: {zip_path}")
print(f"  Storlek: {os.path.getsize(zip_path)} bytes")

# List contents
with zipfile.ZipFile(zip_path, 'r') as zipf:
    files = sorted(zipf.namelist())
    print(f"\n=== Filer i ZIP ({len(files)} stycken) ===")
    for f in files:
        print(f"  {f}")

print("\n=== KLART! Nu kan du ladda upp till Chrome Web Store ===")
