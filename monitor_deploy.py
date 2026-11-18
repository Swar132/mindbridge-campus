import requests
import json
import time

SERVICE_ID = "srv-dbutj8jl550s73bkg680"
DEPLOY_ID = "dep-dbv0qo8u01pc73cfgt3g"
API_KEY = "rnd_G2kV8nAPjIzT52XbqK0L2ieDwX2Z"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def monitor_deploy():
    url = f"https://api.render.com/v1/services/{SERVICE_ID}/deploys/{DEPLOY_ID}"
    print(f"Monitoring deploy {DEPLOY_ID} on Render...")
    for i in range(30):
        try:
            res = requests.get(url, headers=HEADERS, timeout=10)
            if res.status_code == 200:
                data = res.json()
                status = data.get("status")
                print(f"[{i * 10}s] Deploy status: {status}")
                if status == "live":
                    print("SUCCESS! Render deployment is LIVE!")
                    return True
                elif status in ["build_failed", "update_failed", "canceled", "deactivated"]:
                    print(f"DEPLOY FAILED: {status}")
                    print(json.dumps(data, indent=2))
                    return False
            else:
                print(f"Error {res.status_code}: {res.text}")
        except Exception as e:
            print("Error polling:", e)
        time.sleep(10)
    print("Timed out waiting for deploy to finish.")
    return False

if __name__ == "__main__":
    monitor_deploy()
