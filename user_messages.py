import json

with open(r'C:\Users\swarp\.gemini\antigravity\brain\23921ed0-9cca-41d7-9275-b0c591ecf910\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        data = json.loads(line)
        if data.get('source') == 'USER_EXPLICIT' or data.get('type') == 'USER_INPUT':
            print(f"Step {data.get('step_index')}: {data.get('content', '')[:300]}")
