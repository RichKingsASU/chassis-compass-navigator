"""
BlackBerry Radar — Token Acknowledgment
=========================================
Run this ONLY after you have confirmed all historical GPS data
is loaded correctly in Supabase.

Acknowledging a token tells BlackBerry that you have received
that data block. The stream will then advance forward and you
will LOSE ACCESS to the historical backlog.

DO NOT run this until you are ready.
"""

import jwt, time, json, requests, os

ACCOUNTS = {
    "tran": {
        "private_key": """-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg4KuRCN2OjBPZQ88k
SJ9qAhhBO5KQBFxLs7+QOg2wjIyhRANCAATLni2wIHmJGkJUFkG4weQt5ZaW1UF7
cB4/1Mia4+vLcJDUB2z52CN6z7vDgeydhNWGCFDm1rngS4T//oDnjQLE
-----END PRIVATE KEY-----""",
        "base_url": "https://api.radar.blackberry.com",
        "token_file": "tran_stream_token.json",
    },
    "log": {
        "private_key": """-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgJemGeiIYfqLKjuje
3Q1C/boq7yRsFnNz0IPTDG9WBUChRANCAAT7D176Xs7mQzyRUJb/mKfRdMWyzg4U
7G/B694XDjnk4p/MsYCJBvvu0rD1R4lpiRTF8mjZoGMH5ekQiC9z/qzb
-----END PRIVATE KEY-----""",
        "base_url": "https://api.radar.blackberry.com",
        "token_file": "log_stream_token.json",
    },
}

def make_jwt(private_key):
    now = int(time.time())
    return jwt.encode({"iat": now, "exp": now+300, "scope": "assets:stream"},
                      private_key, algorithm="ES256")

for name, cfg in ACCOUNTS.items():
    if not os.path.exists(cfg["token_file"]):
        print(f"{name}: No saved token file found — skipping.")
        continue

    with open(cfg["token_file"]) as f:
        saved = json.load(f)
    token = saved.get("token")
    if not token:
        print(f"{name}: Token file empty — skipping.")
        continue

    confirm = input(f"\nAcknowledge {name.upper()} stream token? This is IRREVERSIBLE. (yes/no): ")
    if confirm.strip().lower() != "yes":
        print(f"  Skipped {name}.")
        continue

    headers = {
        "Authorization": f"Bearer {make_jwt(cfg['private_key'])}",
        "Content-Type": "application/json",
    }
    resp = requests.put(
        f"{cfg['base_url']}/assets/data/token",
        headers=headers,
        json={"token": token},
        timeout=30
    )
    print(f"  {name}: HTTP {resp.status_code} — {resp.text[:200]}")
