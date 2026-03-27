#!/usr/bin/env python3
"""
BlackBerry Radar API Discovery Tool (Phase 1)

Probes the BlackBerry Radar REST API to discover:
  - Available endpoints (assets, locations, events, sensors, etc.)
  - Pagination style and limits
  - Date-range parameters and maximum historical window
  - Rate-limit headers
  - Authentication method

Usage:
    python scripts/radar_discover.py

Requires:
    RADAR_API_BASE_URL   – e.g. https://api.blackberry.com/radar/v1
    RADAR_API_KEY        – Bearer token or API key
"""

import asyncio
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_URL = os.getenv("RADAR_API_BASE_URL", "").rstrip("/")
API_KEY = os.getenv("RADAR_API_KEY", "")
REPORT_DIR = Path(__file__).resolve().parent.parent / "reports"

# Candidate endpoint paths to probe (common Radar REST patterns)
CANDIDATE_ENDPOINTS = [
    "/assets",
    "/assets/locations",
    "/assets/events",
    "/assets/sensors",
    "/locations",
    "/events",
    "/sensors",
    "/sensor-readings",
    "/reports",
    "/reports/locations",
    "/reports/events",
    "/geofences",
    "/alerts",
    "/devices",
    "/organizations",
    "/users",
    "/health",
    "/ping",
    "/status",
    "/version",
]

# Date-range probing windows (days back from now)
HISTORY_WINDOWS = [7, 30, 60, 90, 180, 365, 730]


def _auth_headers() -> dict[str, str]:
    """Return authorization headers. Supports Bearer token and x-api-key."""
    headers: dict[str, str] = {"Accept": "application/json"}
    if API_KEY:
        # Try Bearer first; the report will note which style works
        headers["Authorization"] = f"Bearer {API_KEY}"
    return headers


def _alt_auth_headers() -> dict[str, str]:
    """Alternative auth using x-api-key header."""
    headers: dict[str, str] = {"Accept": "application/json"}
    if API_KEY:
        headers["x-api-key"] = API_KEY
    return headers


async def probe_endpoint(
    client: httpx.AsyncClient, path: str
) -> dict:
    """Probe a single endpoint and return discovery metadata."""
    url = f"{BASE_URL}{path}"
    result: dict = {
        "path": path,
        "url": url,
        "exists": False,
        "status_code": None,
        "auth_style": None,
        "pagination": None,
        "rate_limit": None,
        "sample_keys": [],
        "record_count_hint": None,
        "error": None,
    }

    for style, hdr_fn in [("bearer", _auth_headers), ("api_key", _alt_auth_headers)]:
        try:
            resp = await client.get(url, headers=hdr_fn(), params={"limit": 1, "page_size": 1, "per_page": 1})
            result["status_code"] = resp.status_code

            # Capture rate-limit headers
            rl = {}
            for h in ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset",
                       "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset",
                       "Retry-After"]:
                val = resp.headers.get(h)
                if val:
                    rl[h] = val
            if rl:
                result["rate_limit"] = rl

            if resp.status_code == 200:
                result["exists"] = True
                result["auth_style"] = style

                body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}

                # Detect pagination
                pagination_info = _detect_pagination(body, resp.headers)
                result["pagination"] = pagination_info

                # Sample top-level keys
                if isinstance(body, dict):
                    result["sample_keys"] = list(body.keys())[:20]
                    # Try to find total count
                    for key in ["total", "totalCount", "total_count", "count", "meta"]:
                        if key in body:
                            val = body[key]
                            if isinstance(val, int):
                                result["record_count_hint"] = val
                            elif isinstance(val, dict) and "total" in val:
                                result["record_count_hint"] = val["total"]
                elif isinstance(body, list):
                    result["sample_keys"] = list(body[0].keys())[:20] if body else []
                    result["record_count_hint"] = len(body)

                break  # auth worked, stop trying alternatives

            if resp.status_code in (401, 403):
                result["error"] = f"Auth failed with {style} (HTTP {resp.status_code})"
                continue  # try next auth style

            if resp.status_code == 404:
                result["error"] = "Not found"
                break

            result["error"] = f"HTTP {resp.status_code}"
            break

        except httpx.RequestError as exc:
            result["error"] = str(exc)
            break

    return result


def _detect_pagination(body: dict | list, headers: dict) -> dict | None:
    """Detect pagination style from response body and headers."""
    info: dict = {}

    if isinstance(body, dict):
        # Offset-based
        for key in ["offset", "skip"]:
            if key in body:
                info["style"] = "offset"
                info["offset_param"] = key
                break

        # Cursor-based
        for key in ["next_cursor", "cursor", "nextCursor", "next_page_token", "nextPageToken"]:
            if key in body:
                info["style"] = "cursor"
                info["cursor_param"] = key
                info["cursor_value"] = body[key]
                break

        # Page-based
        for key in ["page", "current_page", "currentPage"]:
            if key in body:
                info["style"] = "page"
                break

        # Total pages / has_more
        for key in ["total_pages", "totalPages", "last_page", "lastPage"]:
            if key in body:
                info["total_pages"] = body[key]
        for key in ["has_more", "hasMore", "has_next", "hasNext"]:
            if key in body:
                info["has_more"] = body[key]

        # Page size
        for key in ["limit", "page_size", "pageSize", "per_page", "perPage"]:
            if key in body:
                info["page_size"] = body[key]

    # Link header (RFC 8288)
    link = headers.get("Link") or headers.get("link")
    if link:
        info["style"] = "link_header"
        info["link_header"] = link

    return info if info else None


async def probe_history_window(
    client: httpx.AsyncClient, endpoint: str
) -> dict:
    """Probe how far back historical data is available."""
    result: dict = {"endpoint": endpoint, "max_window_days": 0, "windows_tested": {}}
    now = datetime.now(timezone.utc)

    for days in HISTORY_WINDOWS:
        start = now - timedelta(days=days)
        params = {
            "start_date": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "end_date": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "from": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "to": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "since": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "limit": 1,
            "page_size": 1,
        }

        try:
            resp = await client.get(
                f"{BASE_URL}{endpoint}", headers=_auth_headers(), params=params
            )
            if resp.status_code == 200:
                body = resp.json() if "json" in resp.headers.get("content-type", "") else {}
                count = 0
                if isinstance(body, list):
                    count = len(body)
                elif isinstance(body, dict):
                    for key in ["total", "totalCount", "total_count", "count"]:
                        if key in body and isinstance(body[key], int):
                            count = body[key]
                            break
                    if not count:
                        data_key = next(
                            (k for k in ["data", "results", "items", "records", "assets", "locations", "events"]
                             if k in body and isinstance(body[k], list)),
                            None,
                        )
                        if data_key:
                            count = len(body[data_key])

                result["windows_tested"][f"{days}d"] = {
                    "status": resp.status_code,
                    "record_count": count,
                }
                if count > 0:
                    result["max_window_days"] = days
            else:
                result["windows_tested"][f"{days}d"] = {
                    "status": resp.status_code,
                    "record_count": 0,
                }
        except httpx.RequestError as exc:
            result["windows_tested"][f"{days}d"] = {"error": str(exc)}

    return result


async def discover():
    """Run the full discovery process."""
    print("=" * 70)
    print("  BlackBerry Radar API Discovery")
    print("=" * 70)
    print(f"  Base URL : {BASE_URL or '(not set)'}")
    print(f"  API Key  : {'***' + API_KEY[-4:] if len(API_KEY) > 4 else '(not set)'}")
    print(f"  Time     : {datetime.now(timezone.utc).isoformat()}")
    print("=" * 70)

    if not BASE_URL:
        print("\n[ERROR] RADAR_API_BASE_URL is not set. Add it to .env and retry.")
        sys.exit(1)
    if not API_KEY:
        print("\n[ERROR] RADAR_API_KEY is not set. Add it to .env and retry.")
        sys.exit(1)

    report: dict = {
        "discovery_timestamp": datetime.now(timezone.utc).isoformat(),
        "base_url": BASE_URL,
        "endpoints": [],
        "history_windows": [],
        "summary": {},
    }

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        # ----- Phase 1a: Probe all candidate endpoints -----
        print("\n[1/3] Probing endpoints...")
        tasks = [probe_endpoint(client, ep) for ep in CANDIDATE_ENDPOINTS]
        results = await asyncio.gather(*tasks)

        live_endpoints: list[str] = []
        for r in results:
            status_icon = "✓" if r["exists"] else "✗"
            code_str = f"HTTP {r['status_code']}" if r["status_code"] else "no response"
            print(f"  {status_icon} {r['path']:30s}  {code_str:12s}  auth={r['auth_style'] or '-'}")
            report["endpoints"].append(r)
            if r["exists"]:
                live_endpoints.append(r["path"])

        if not live_endpoints:
            print("\n[WARN] No live endpoints found. Check your base URL and credentials.")
            print("       Make sure RADAR_API_BASE_URL points to the correct API version.")
            print("       Common patterns:")
            print("         https://api.blackberry.com/radar/v1")
            print("         https://radar.blackberry.com/api/v1")
            print("         https://<org>.radar.blackberry.com/api")

        # ----- Phase 1b: Probe history windows on data endpoints -----
        data_endpoints = [
            ep for ep in live_endpoints
            if any(kw in ep for kw in ["location", "event", "sensor", "asset"])
        ]

        if data_endpoints:
            print(f"\n[2/3] Probing historical windows on {len(data_endpoints)} data endpoint(s)...")
            history_tasks = [probe_history_window(client, ep) for ep in data_endpoints]
            history_results = await asyncio.gather(*history_tasks)
            for hr in history_results:
                print(f"  {hr['endpoint']:30s}  max_window={hr['max_window_days']}d")
                for window, info in hr["windows_tested"].items():
                    detail = f"count={info.get('record_count', '?')}" if "error" not in info else f"error={info['error']}"
                    print(f"    {window:>6s}: {detail}")
                report["history_windows"].append(hr)
        else:
            print("\n[2/3] No data endpoints to probe for history windows.")

        # ----- Phase 1c: Summary -----
        print(f"\n[3/3] Summary")
        summary = {
            "total_probed": len(CANDIDATE_ENDPOINTS),
            "live_endpoints": live_endpoints,
            "live_count": len(live_endpoints),
            "auth_style": next(
                (r["auth_style"] for r in results if r["auth_style"]), None
            ),
            "max_history_days": max(
                (hr["max_window_days"] for hr in report.get("history_windows", []) if hr.get("max_window_days")),
                default=0,
            ),
            "rate_limit_detected": any(r.get("rate_limit") for r in results),
            "pagination_style": next(
                (r["pagination"]["style"] for r in results if r.get("pagination") and r["pagination"].get("style")),
                None,
            ),
        }
        report["summary"] = summary

        print(f"  Live endpoints   : {summary['live_count']}/{summary['total_probed']}")
        print(f"  Auth style       : {summary['auth_style'] or 'unknown'}")
        print(f"  Pagination       : {summary['pagination_style'] or 'unknown'}")
        print(f"  Rate limiting    : {'yes' if summary['rate_limit_detected'] else 'not detected'}")
        print(f"  Max history      : {summary['max_history_days']} days")

    # ----- Write report -----
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORT_DIR / "radar_discovery_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"\n  Report saved to: {report_path}")
    print("=" * 70)

    return report


if __name__ == "__main__":
    asyncio.run(discover())
