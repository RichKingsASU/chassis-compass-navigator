
import os
import sys
import json
import urllib.parse
import requests

def main():
    # Get environment variables
    srk = os.environ.get("SRK")
    bb_api_base = os.environ.get("BB_API_BASE")
    bb_client_id = os.environ.get("BB_CLIENT_ID")
    bb_client_secret = os.environ.get("BB_CLIENT_SECRET")
    bb_account_ids = os.environ.get("BB_ACCOUNT_IDS")

    if not all([srk, bb_api_base, bb_client_id, bb_client_secret, bb_account_ids]):
        print("Error: One or more required environment variables are not set.", file=sys.stderr)
        sys.exit(1)

    api = "https://fucvkmsaappphsvuabos.supabase.co"
    headers = {
        "apikey": srk,
        "Authorization": f"Bearer {srk}",
        "Content-Type": "application/json"
    }

    def org_id_by_name(name):
        encoded_name = urllib.parse.quote(name)
        url = f"{api}/rest/v1/orgs?select=id&name=eq.{encoded_name}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data[0]["id"] if data else None

    def upsert_cfg(org_id):
        account_ids_list = [acc.strip() for acc in bb_account_ids.split(',')]
        options = {
            "api_base": bb_api_base,
            "client_id": bb_client_id,
            "client_secret": bb_client_secret,
            "account_ids": account_ids_list,
            "since_days": 30
        }
        
        rpc_url = f"{api}/rest/v1/rpc/upsert_blackberry_config"
        payload = {
            "p_org_id": org_id,
            "p_options": options
        }
        
        response = requests.post(rpc_url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()


    ft_id = org_id_by_name("Forrest Transportation")
    fl_id = org_id_by_name("Forrest Logistics")

    if not fl_id:
        print("Creating 'Forrest Logistics' organization...")
        create_org_url = f"{api}/rest/v1/orgs"
        create_org_data = {"name": "Forrest Logistics"}
        response = requests.post(create_org_url, headers=headers, data=json.dumps(create_org_data))
        response.raise_for_status()
        fl_id = org_id_by_name("Forrest Logistics")

    print(f"Forrest Transportation: {ft_id}")
    print(f"Forrest Logistics:     {fl_id}")

    if ft_id:
        upsert_cfg(ft_id)
    if fl_id:
        upsert_cfg(fl_id)

    print("✅ BlackBerry provider_config upserted for both orgs.")

if __name__ == "__main__":
    main()
