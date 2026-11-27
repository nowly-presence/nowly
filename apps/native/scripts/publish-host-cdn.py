#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

VIRUSTOTAL_API = "https://www.virustotal.com/api/v3"
VIRUSTOTAL_DIRECT_UPLOAD_LIMIT = 32_000_000
# The public API allows 4 requests per minute
VIRUSTOTAL_REQUEST_INTERVAL = 16

last_virustotal_request = 0.0


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def virustotal_request(api_key: str, arguments: list[str]) -> dict:
    global last_virustotal_request
    time.sleep(max(0.0, last_virustotal_request + VIRUSTOTAL_REQUEST_INTERVAL - time.monotonic()))
    last_virustotal_request = time.monotonic()
    # The key goes through stdin so it never shows up in the process list or in errors
    output = subprocess.check_output(
        ["curl", "--config", "-", "--fail", "--silent", "--show-error", "--max-time", "300", *arguments],
        input=f'header = "x-apikey: {api_key}"\n'.encode("utf-8"),
    )
    return json.loads(output)


def virustotal_report(path: Path, sha256: str) -> str | None:
    """Upload the file to VirusTotal and return its report page. Never blocks a release."""
    api_key = os.environ.get("VIRUSTOTAL_API_KEY")
    if not api_key:
        return None
    try:
        endpoint = f"{VIRUSTOTAL_API}/files"
        if path.stat().st_size > VIRUSTOTAL_DIRECT_UPLOAD_LIMIT:
            endpoint = virustotal_request(api_key, [f"{VIRUSTOTAL_API}/files/upload_url"])["data"]
        virustotal_request(api_key, ["--form", f'file=@"{path.as_posix()}"', endpoint])
    except (OSError, subprocess.CalledProcessError, ValueError, KeyError) as error:
        print(f"::warning::VirusTotal upload failed for {path.name}: {error}", file=sys.stderr)
        return None
    return f"https://www.virustotal.com/gui/file/{sha256}"


def artifact(path: Path, url: str) -> dict[str, str | int]:
    entry: dict[str, str | int] = {"url": url, "sha256": sha256_file(path), "size": path.stat().st_size}
    report = virustotal_report(path, str(entry["sha256"]))
    if report:
        entry["virustotalUrl"] = report
    return entry


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
    parser.add_argument("--linux-deb")
    parser.add_argument("--macos-dmg")
    args = parser.parse_args()

    version = args.release_version
    installer = require_file(args.installer)
    portable = require_file(args.portable)
    linux = require_file(args.linux)
    linux_deb = require_file(args.linux_deb)
    dmg = require_file(args.macos_dmg)
    if not any([installer, portable, linux, linux_deb, dmg]):
        raise SystemExit("at least one artifact is required")

    for name in ("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ACCOUNT_ID"):
        if not os.environ.get(name):
            raise SystemExit(f"missing {name}")

    if not os.environ.get("VIRUSTOTAL_API_KEY"):
        print("::warning::VIRUSTOTAL_API_KEY is not set, publishing without VirusTotal reports", file=sys.stderr)

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
        manifest.setdefault("linux", {})["archive"] = artifact(linux, url)

    if linux_deb:
        url = put_object("installer/nowly-host.deb", linux_deb, "application/vnd.debian.binary-package", "public, max-age=300")
        put_object(f"installer/releases/{version}/nowly-host.deb", linux_deb, "application/vnd.debian.binary-package", "public, max-age=31536000, immutable")
        manifest.setdefault("linux", {})["deb"] = artifact(linux_deb, url)

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
