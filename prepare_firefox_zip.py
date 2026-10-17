#!/usr/bin/env python3
"""Build PrivateLinkSaver Firefox.zip for addons.mozilla.org."""

from __future__ import annotations

import json
import shutil
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
STAGING = ROOT / "_firefox_build"
ZIP_NAME = ROOT / "PrivateLinkSaver Firefox.zip"

INCLUDE_FILES = [
    "manifest.json",
    "popup.html",
    "options.html",
    "LICENSE",
    "privacy.html",
]

INCLUDE_DIRS = [
    "icons",
    "scripts",
    "styles",
    "vendor",
    "_locales",
]

EXCLUDE_NAME_PARTS = ("_OLD_", "-resized", "kaffe-icon")


def chrome_manifest() -> dict:
    return json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))


def make_icon_sizes() -> None:
    """Create exact 16/32/48/128 PNGs so AMO icon-size checks pass."""
    src = ROOT / "icons" / "icon128.png"
    if not src.exists():
        raise FileNotFoundError("icons/icon128.png missing")
    icons_dir = STAGING / "icons"
    icons_dir.mkdir(parents=True, exist_ok=True)
    base = Image.open(src).convert("RGBA")
    for size in (16, 32, 48, 128):
        resized = base.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(icons_dir / f"icon{size}.png", format="PNG")


def build_firefox_manifest() -> dict:
    m = chrome_manifest()
    # Firefox requires background.scripts (service_worker alone fails AMO validation)
    m["background"] = {
        "scripts": ["scripts/vault.js", "scripts/background.js"]
    }

    icon_map = {
        "16": "icons/icon16.png",
        "32": "icons/icon32.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png",
    }
    m["icons"] = icon_map
    if "action" in m:
        m["action"]["default_icon"] = icon_map

    # Favicons + optional Firebase sync
    hosts = [
        "https://www.google.com/s2/favicons*",
        "https://*.googleapis.com/*",
        "https://*.firebaseio.com/*",
        "https://firestore.googleapis.com/*",
        "https://identitytoolkit.googleapis.com/*",
        "https://securetoken.googleapis.com/*",
    ]
    existing = list(m.get("host_permissions", []))
    for h in hosts:
        if h not in existing:
            existing.append(h)
    m["host_permissions"] = existing

    gecko = m.setdefault("browser_specific_settings", {}).setdefault("gecko", {})
    gecko.setdefault("id", "privatelinksaver@nrnworld.one")
    gecko["strict_min_version"] = "142.0"
    gecko["data_collection_permissions"] = {
        "required": ["none"],
        "optional": ["authenticationInfo", "bookmarksInfo"],
    }
    return m


def should_skip(path: Path) -> bool:
    name = path.name
    return any(part in name for part in EXCLUDE_NAME_PARTS)


def stage() -> None:
    if STAGING.exists():
        shutil.rmtree(STAGING)
    STAGING.mkdir(parents=True)

    # Root privacy copy for AMO package readers
    privacy_src = ROOT / "docs" / "privacy.html"
    if not privacy_src.exists():
        raise FileNotFoundError("docs/privacy.html missing")
    shutil.copy2(privacy_src, STAGING / "privacy.html")

    for name in INCLUDE_FILES:
        if name == "privacy.html":
            continue
        src = ROOT / name
        if not src.exists():
            raise FileNotFoundError(f"Missing required file: {name}")
        shutil.copy2(src, STAGING / name)

    for folder in INCLUDE_DIRS:
        base = ROOT / folder
        if not base.exists():
            raise FileNotFoundError(f"Missing required dir: {folder}")
        for path in sorted(base.rglob("*")):
            if not path.is_file() or should_skip(path):
                continue
            rel = path.relative_to(ROOT)
            dest = STAGING / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, dest)

    make_icon_sizes()

    manifest = build_firefox_manifest()
    (STAGING / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def build_zip() -> None:
    if ZIP_NAME.exists():
        ZIP_NAME.unlink()
    with zipfile.ZipFile(ZIP_NAME, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path in sorted(STAGING.rglob("*")):
            if path.is_file():
                arc = path.relative_to(STAGING).as_posix()
                zf.write(path, arc)
                print(f"  + {arc}")
    print(f"ZIP ready: {ZIP_NAME.name} ({ZIP_NAME.stat().st_size / 1024:.1f} KB)")


def verify() -> None:
    with zipfile.ZipFile(ZIP_NAME, "r") as zf:
        names = set(zf.namelist())
        manifest = json.loads(zf.read("manifest.json"))
    required = {
        "manifest.json",
        "popup.html",
        "options.html",
        "scripts/background.js",
        "scripts/popup.js",
        "privacy.html",
        "icons/icon128.png",
    }
    missing = sorted(required - names)
    if missing:
        raise RuntimeError("Missing: " + ", ".join(missing))
    gecko = manifest.get("browser_specific_settings", {}).get("gecko", {})
    if gecko.get("id") != "privatelinksaver@nrnworld.one":
        raise RuntimeError("Bad gecko.id")
    if gecko.get("strict_min_version", "0") < "142.0":
        raise RuntimeError("strict_min_version must be >= 142.0")
    if "data_collection_permissions" not in gecko:
        raise RuntimeError("Missing gecko.data_collection_permissions")
    bg = manifest.get("background", {})
    if "scripts" not in bg:
        raise RuntimeError("Firefox background.scripts required")
    if "service_worker" in bg and "scripts" not in bg:
        raise RuntimeError("service_worker without scripts fallback")
    for size in (16, 32, 48, 128):
        key = f"icons/icon{size}.png"
        if key not in names:
            raise RuntimeError(f"Missing {key}")
    print(
        f"Firefox ZIP check OK ({len(names)} files), "
        f"id={gecko.get('id')}, v={manifest.get('version')}, min={gecko.get('strict_min_version')}"
    )


def main() -> None:
    print("Building Firefox AMO package...")
    stage()
    build_zip()
    verify()
    shutil.rmtree(STAGING, ignore_errors=True)
    print()
    print(f"Upload: {ZIP_NAME}")


if __name__ == "__main__":
    main()
