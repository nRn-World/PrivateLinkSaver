#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
import zipfile

# Swedish locale with Unicode escape sequences for correct characters
swedish_json = """{
  "extName": {
    "message": "PrivateLinkSaver",
    "description": "Extension name"
  },
  "extDescription": {
    "message": "Spara och organisera dina l\\u00e4nkar privat och s\\u00e4kert med l\\u00f6senordsskydd",
    "description": "Extension description"
  },
  "cmdSavePage": {
    "message": "Spara aktuell sida till bokm\\u00e4rken",
    "description": "Save current page command"
  },
  "cmdOpenPopup": {
    "message": "\\u00d6ppna PrivateLinkSaver popup",
    "description": "Open popup command"
  },
  "cmdQuickSearch": {
    "message": "Snabbs\\u00f6kning i bokm\\u00e4rken",
    "description": "Quick search command"
  },
  "contextSaveLink": {
    "message": "Spara l\\u00e4nk till PrivateLinkSaver",
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
    "message": "Denna sida \\u00e4r redan sparad!",
    "description": "Notification already exists"
  },
  "notificationLoginRequired": {
    "message": "V\\u00e4nligen logga in f\\u00f6r att spara bokm\\u00e4rken",
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
}"""

# Write Swedish locale file with UTF-8 encoding
sv_path = r"D:\APPS By nRn World\Chrome\PrivateLinkSaver\_locales\sv\messages.json"
with open(sv_path, "w", encoding="utf-8") as f:
    f.write(swedish_json)
print("✓ Svenska språkfilen skapad med korrekta tecken (å, ä, ö)")

# Verify the file
with open(sv_path, "r", encoding="utf-8") as f:
    data = json.load(f)
    print(f"✓ JSON validerad! Antal nycklar: {len(data)}")
    print(f"  Test: {data['extDescription']['message']}")

# Create ZIP file for Chrome Web Store
base_path = r"D:\APPS By nRn World\Chrome\PrivateLinkSaver"
zip_path = os.path.join(base_path, "PrivateLinkSaver_v2.4.2.zip")

# Remove old ZIP if exists
if os.path.exists(zip_path):
    os.remove(zip_path)
    print("✓ Tog bort gammal ZIP")

# Items to include
include_items = [
    "icons", "scripts", "styles", "vendor", "_locales",
    "manifest.json", "popup.html", "options.html",
    "README.md", "LICENSE", "PRIVACY.md"
]

# Create ZIP
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
            zipf.write(item_path, item)

print(f"\n✓ ZIP-fil skapad: {zip_path}")
print(f"  Storlek: {os.path.getsize(zip_path)} bytes")

# List contents
with zipfile.ZipFile(zip_path, 'r') as zipf:
    files = sorted(zipf.namelist())
    print(f"\n=== Filer i ZIP ({len(files)} stycken) ===")
    for f in files:
        print(f"  {f}")

print("\n=== KLART! Nu kan du ladda upp till Chrome Web Store ===")
