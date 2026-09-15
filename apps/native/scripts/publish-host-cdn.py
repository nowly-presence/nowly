#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def artifact(path: Path, url: str) -> dict[str, str | int]:
    return {"url": url, "sha256": sha256_file(path), "size": path.stat().st_size}


def put_object(key: str, path: Path, content_type: str, cache_control: str) -> str:
    account_id = os.environ["R2_ACCOUNT_ID"]
    bucket = os.environ.get("R2_BUCKET") or "nowly"
    public_url = (os.environ.get("R2_PUBLIC_URL") or "https://cdn.nowly.me").rstrip("/")
    endpoint = f"https://{account_id}.r2.cloudflarestorage.com"
    env = os.environ.copy()
    env["AWS_ACCESS_KEY_ID"] = os.environ["R2_ACCESS_KEY_ID"]
    env["AWS_SECRET_ACCESS_KEY"] = os.environ["R2_SECRET_ACCESS_KEY"]
    env["AWS_DEFAULT_REGION"] = "auto"
    subprocess.check_call(
        [
            "aws",
            "s3api",
            "put-object",
            "--bucket",
            bucket,
            "--key",
            key,
            "--body",
            str(path),
            "--content-type",
            content_type,
            "--cache-control",
            cache_control,
            "--endpoint-url",
            endpoint,
        ],
        env=env,
    )
    return f"{public_url}/{key}"


def put_json(key: str, value: dict, cache_control: str) -> None:
    tmp = Path(os.environ.get("RUNNER_TEMP") or ".") / "host-latest.json"
    tmp.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
    put_object(key, tmp, "application/json; charset=utf-8", cache_control)


def require_file(path: str | None) -> Path | None:
    if not path:
        return None
    resolved = Path(path)
    if not resolved.is_file():
        raise SystemExit(f"artifact not found: {resolved}")
    return resolved


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--release-version", required=True)
    parser.add_argument("--installer")
    parser.add_argument("--portable")
    parser.add_argument("--linux")
    parser.add_argument("--macos-dmg")
    args = parser.parse_args()

    version = args.release_version
    installer = require_file(args.installer)
    portable = require_file(args.portable)
    linux = require_file(args.linux)
    dmg = require_file(args.macos_dmg)
    if not any([installer, portable, linux, dmg]):
        raise SystemExit("at least one artifact is required")

    for name in ("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ACCOUNT_ID"):
        if not os.environ.get(name):
            raise SystemExit(f"missing {name}")

    manifest: dict = {
        "version": version,
        "releasedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
    }

    if installer:
        url = put_object("installer/nowly-setup.exe", installer, "application/vnd.microsoft.portable-executable", "public, max-age=300")
        put_object(f"installer/releases/{version}/nowly-setup.exe", installer, "application/vnd.microsoft.portable-executable", "public, max-age=31536000, immutable")
        manifest.setdefault("windows", {})["installer"] = artifact(installer, url)

    if portable:
        url = put_object("installer/nowly-windows.zip", portable, "application/zip", "public, max-age=300")
        put_object(f"installer/releases/{version}/nowly-windows.zip", portable, "application/zip", "public, max-age=31536000, immutable")
        manifest.setdefault("windows", {})["portable"] = artifact(portable, url)

    if linux:
        url = put_object("installer/nowly-linux.tar.gz", linux, "application/gzip", "public, max-age=300")
        put_object(f"installer/releases/{version}/nowly-linux.tar.gz", linux, "application/gzip", "public, max-age=31536000, immutable")
        manifest["linux"] = {"archive": artifact(linux, url)}

    if dmg:
        url = put_object("installer/nowly-macos.dmg", dmg, "application/x-apple-diskimage", "public, max-age=300")
        put_object(f"installer/releases/{version}/nowly-macos.dmg", dmg, "application/x-apple-diskimage", "public, max-age=31536000, immutable")
        manifest.setdefault("macos", {})["dmg"] = artifact(dmg, url)

    put_json(f"installer/releases/{version}/latest.json", manifest, "public, max-age=31536000, immutable")
    put_json("installer/latest.json", manifest, "public, max-age=60")
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
