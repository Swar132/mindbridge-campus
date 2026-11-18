import requests
import json
import time

SERVICE_ID = "srv-dbutj8jl550s73bkg680"
API_KEY = "rnd_G2kV8nAPjIzT52XbqK0L2ieDwX2Z"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def trigger_deploy():
    print(f"Triggering deploy for Render service {SERVICE_ID}...")
    url = f"https://api.render.com/v1/services/{SERVICE_ID}/deploys"
    res = requests.post(url, headers=HEADERS, json={"clearCache": "clear"})
    print("Response Code:", res.status_code)
    try:
        data = res.json()
        print(json.dumps(data, indent=2))
        return data.get("id") or data.get("deploy", {}).get("id")
    except Exception:
        print(res.text)
        return None

if __name__ == "__main__":
    deploy_id = trigger_deploy()
    print("Triggered deploy ID:", deploy_id)
