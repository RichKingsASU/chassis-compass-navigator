import os
import sys
import json
import requests

def main():
    # 1) Get Service Role Key (SRK) from env
    srk = os.environ.get("SRK")
    if not srk:
        print("Error: SRK environment variable not set.", file=sys.stderr)
        sys.exit(1)

    api = "https://fucvkmsaappphsvuabos.supabase.co"
    headers = {
        "apikey": srk,
        "Authorization": f"Bearer {srk}"
    }

    # 3) Find or create orgs
    def org_id_by_name(name):
        url = f"{api}/rest/v1/orgs?select=id&name=eq.{name}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data[0]["id"] if data else None

    def ensure_org(name):
        org_id = org_id_by_name(name)
        if not org_id:
            print(f"Creating '{name}' organization...")
            url = f"{api}/rest/v1/orgs"
            data = {"name": name}
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            org_id = org_id_by_name(name)
        return org_id

    ft_id = ensure_org("Forrest Transportation")
    fl_id = ensure_org("Forrest Logistics")
    print(f"Forrest Transportation: {ft_id}")
    print(f"Forrest Logistics:     {fl_id}")

    # 4) Get BlackBerry creds from env
    bb_api_base = os.environ.get("BB_API_BASE")
    bb_client_id = os.environ.get("BB_CLIENT_ID")
    bb_client_secret = os.environ.get("BB_CLIENT_SECRET")
    bb_account_ids = os.environ.get("BB_ACCOUNT_IDS")

    if not all([bb_api_base, bb_client_id, bb_client_secret, bb_account_ids]):
        print("Error: BlackBerry credentials environment variables are not set.", file=sys.stderr)
        sys.exit(1)

    # Use the stored procedure to upsert config
    def upsert_cfg(org_id):
        account_ids_list = [acc.strip() for acc in bb_account_ids.split(',')]
        options = {
            "api_base": bb_api_base,
            "client_id": bb_client_id,
            "client_secret": bb_client_secret,
            "account_ids": account_ids_list,
            "since_days": 1
        }
        
        rpc_url = f"{api}/rest/v1/rpc/upsert_blackberry_config"
        payload = {
            "p_org_id": org_id,
            "p_options": options
        }
        
        response = requests.post(rpc_url, headers=headers, json=payload)
        response.raise_for_status()

    print("Configuring provider_config for both orgs...")
    upsert_cfg(ft_id)
    upsert_cfg(fl_id)
    print("✅ provider_config upserted.")

    # 5) Trigger backfill for both orgs
    def run_backfill(org_id, lookback_days):
        print(f"▶ Backfill for org {org_id} with lookback={lookback_days}")
        url = f"{api}/functions/v1/bb-backfill"
        data = {"org_id": org_id, "lookback_days": lookback_days}
        response = requests.post(url, headers=headers, json=data)
        print(response.json())

    run_backfill(ft_id, 1)
    run_backfill(fl_id, 1)


    # 6) Show recent staging rows + unmapped devices
    def dump_recent_staging(org_id):
        print(f"---- recent staging rows for org {org_id} ----")
        try:
            url = f"{api}/rest/v1/staging_blackberry_locations?select=org_id,external_device_id,ts,lat,lon,source,created_at&org_id=eq.{org_id}&order=created_at.desc&limit=10"
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            print(response.json())
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                print("    (table not found, skipping)")
            else:
                raise e

    def list_unmapped_devices(org_id):
        print(f"---- DISTINCT external_device_id without mapping (org {org_id}) ----")
        try:
            # Get all devices by calling the stored procedure
            rpc_url = f"{api}/rest/v1/rpc/get_distinct_external_device_ids"
            payload = {"p_org_id": org_id}
            response_all = requests.post(rpc_url, headers=headers, json=payload)
            response_all.raise_for_status()
            all_devices = {d["external_device_id"] for d in response_all.json()}

            # Get mapped devices
            url_mapped = f"{api}/rest/v1/blackberry_device_map?select=external_device_id&org_id=eq.{org_id}&limit=10000"
            response_mapped = requests.get(url_mapped, headers=headers)
            response_mapped.raise_for_status()
            mapped_devices = {d["external_device_id"] for d in response_mapped.json()}

            unmapped_devices = all_devices - mapped_devices
            for device in sorted(list(unmapped_devices)):
                print(f"  - {device}")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                print(f"    (table not found for URL: {e.request.url}, skipping)")
            else:
                print(f"Error: {e.response.status_code} - {e.response.text}")
                raise e

    dump_recent_staging(ft_id)
    dump_recent_staging(fl_id)
    list_unmapped_devices(ft_id)
    list_unmapped_devices(fl_id)

    print("Done.")

if __name__ == "__main__":
    main()