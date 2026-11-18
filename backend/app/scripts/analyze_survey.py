import zipfile
import xml.etree.ElementTree as ET
import csv
import json
import os
from collections import Counter

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def parse_cell_value(c, shared_strings=None):
    t = c.get('t')
    if t == 's' and shared_strings is not None:
        v = c.find('m:v', NS)
        return shared_strings[int(v.text)] if v is not None and v.text else ""
    elif t == 'inlineStr':
        is_elem = c.find('m:is', NS)
        if is_elem is not None:
            t_elem = is_elem.find('m:t', NS)
            return t_elem.text if t_elem is not None and t_elem.text else ""
    else:
        v = c.find('m:v', NS)
        if v is not None and v.text:
            return v.text
        # Fallback check for any text
        t_elem = c.find('.//m:t', NS)
        if t_elem is not None and t_elem.text:
            return t_elem.text
    return ""

def column_index_from_ref(cell_ref):
    letters = ''.join([ch for ch in cell_ref if ch.isalpha()])
    idx = 0
    for ch in letters:
        idx = idx * 26 + (ord(ch.upper()) - ord('A') + 1)
    return idx - 1

def extract_sheet(zip_path, sheet_xml_path):
    with zipfile.ZipFile(zip_path, 'r') as z:
        shared_strings = None
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_root = ET.fromstring(z.read('xl/sharedStrings.xml'))
            shared_strings = []
            for si in ss_root.findall('m:si', NS):
                text_elems = si.findall('.//m:t', NS)
                shared_strings.append("".join([t.text or "" for t in text_elems]))

        root = ET.fromstring(z.read(sheet_xml_path))
        rows_data = []
        for row in root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            cells = row.findall('m:c', NS)
            max_col = 0
            cell_dict = {}
            for c in cells:
                r = c.get('r')
                col_idx = column_index_from_ref(r)
                val = parse_cell_value(c, shared_strings)
                cell_dict[col_idx] = val
                if col_idx > max_col:
                    max_col = col_idx
            
            row_list = [cell_dict.get(i, "") for i in range(max_col + 1)]
            rows_data.append(row_list)
        return rows_data

def run_analysis():
    xlsx_path = r'C:\Users\swarp\.gemini\antigravity\scratch\mindbridge-campus\data\student_survey_responses.xlsx'
    sheet1_rows = extract_sheet(xlsx_path, 'xl/worksheets/sheet1.xml')
    sheet2_rows = extract_sheet(xlsx_path, 'xl/worksheets/sheet2.xml')

    headers = sheet1_rows[0]
    data_rows = sheet1_rows[1:]

    # Save clean CSV
    csv_out_path = r'C:\Users\swarp\.gemini\antigravity\scratch\mindbridge-campus\data\student_survey_responses.csv'
    with open(csv_out_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(sheet1_rows)
    print(f"Saved clean CSV to: {csv_out_path} ({len(data_rows)} responses)")

    # Convert to list of dicts
    records = []
    for r in data_rows:
        row_dict = {}
        for h, val in zip(headers, r):
            row_dict[h.strip()] = val.strip() if val else ""
        records.append(row_dict)

    # Perform detailed analytics
    total_count = len(records)
    orig_count = sum(1 for r in records if r.get('Data Type') == 'Original - collected')
    synth_count = sum(1 for r in records if r.get('Data Type') == 'Synthetic - generated')

    def analyze_col(col_name, is_multiselect=False):
        c = Counter()
        for r in records:
            val = r.get(col_name, "")
            if not val:
                c["(No response)"] += 1
                continue
            if is_multiselect:
                parts = [p.strip() for p in val.split(",") if p.strip()]
                for p in parts:
                    c[p] += 1
            else:
                c[val] += 1
        return dict(c.most_common())

    analysis = {
        "metadata": {
            "total_responses": total_count,
            "original_collected": orig_count,
            "synthetic_generated": synth_count,
            "provenance_note": "Dataset contains 18 original student responses and 282 synthetic pattern-augmented responses."
        },
        "year_of_study": analyze_col("Which year of study are you currently pursuing?"),
        "academic_status": analyze_col("What is your current academic status?"),
        "living_arrangement": analyze_col("What is your current living arrangement?"),
        "stress_frequency": analyze_col("How frequently have you felt stressed during the past two weeks?"),
        "major_stressors": analyze_col("What are the major sources of stress in your student life? (Select all that apply)", is_multiselect=True),
        "overall_mood": analyze_col("How would you describe your overall mood during the past two weeks?"),
        "sleep_hours": analyze_col("On average, how many hours do you sleep per night?"),
        "energy_deficiency_frequency": analyze_col("How often do you feel tired or lacking in energy during the day?"),
        "talk_support_availability": analyze_col("How often do you feel that you have someone you can talk to when you are having a difficult day?"),
        "comfort_discussing_difficulties": analyze_col("How comfortable are you discussing personal difficulties with someone?"),
        "coping_mechanisms": analyze_col("What do you usually do when you feel stressed or emotionally overwhelmed? (Select all that apply)", is_multiselect=True),
        "considered_counselling": analyze_col("Have you ever considered seeking professional mental-health support or counselling?"),
        "counselling_barriers": analyze_col("What might prevent students from seeking mental-health support? (Select all that apply)", is_multiselect=True),
        "most_useful_support": analyze_col("What kind of support would be most useful to you as a college student? (Select all that apply)", is_multiselect=True),
        "interested_in_tracking_app": analyze_col("Would you be interested in using an application that helps you track your mental wellbeing over time?"),
        "desired_tracking_metrics": analyze_col("Which information would you like to track in the application? (Select all that apply)", is_multiselect=True),
        "desired_features": analyze_col("Which features would you like in MindBridge Campus? (Select all that apply)", is_multiselect=True),
        "desired_insights": analyze_col("What kind of insights would you find useful from the application? (Select all that apply)", is_multiselect=True),
        "support_access_mode": analyze_col("How would you prefer to access support through the application?"),
        "communication_preference": analyze_col("When sharing your thoughts or chatting with MindBridge Campus, how would you prefer to communicate?"),
        "reminder_frequency": analyze_col("How frequently would you prefer to receive reminders to complete your wellbeing check-in?"),
        "dashboard_preference": analyze_col("Which dashboard would you prefer?"),
        "trust_factors": analyze_col("What would make you trust and regularly use a mental wellbeing application? (Select all that apply)", is_multiselect=True),
        "open_ended_themes": {
            "quick_checkins_desired": sum(1 for r in records if "quick check-in" in r.get("What would make you use an application like MindBridge Campus regularly?", "").lower() or "quick daily check-ins" in r.get("What would make you trust and regularly use a mental wellbeing application? (Select all that apply)", "").lower()),
            "privacy_confidentiality_emphasis": sum(1 for r in records if "private" in r.get("What would make you use an application like MindBridge Campus regularly?", "").lower() or "confidential" in r.get("What would make you trust and regularly use a mental wellbeing application? (Select all that apply)", "").lower()),
            "academic_placement_stress_emphasis": sum(1 for r in records if "placement" in r.get("What is one major challenge affecting students wellbeing that you think colleges should pay more attention to?", "").lower() or "exam" in r.get("What is one major challenge affecting students wellbeing that you think colleges should pay more attention to?", "").lower())
        }
    }

    # Also calculate pure original responses stats to see divergence
    orig_records = [r for r in records if r.get('Data Type') == 'Original - collected']
    def analyze_orig(col_name, is_multiselect=False):
        c = Counter()
        for r in orig_records:
            val = r.get(col_name, "")
            if not val: continue
            if is_multiselect:
                for p in [x.strip() for x in val.split(",") if x.strip()]: c[p] += 1
            else: c[val] += 1
        return dict(c.most_common())

    analysis["original_sample_stats"] = {
        "sample_size": len(orig_records),
        "stress_frequency": analyze_orig("How frequently have you felt stressed during the past two weeks?"),
        "communication_preference": analyze_orig("When sharing your thoughts or chatting with MindBridge Campus, how would you prefer to communicate?"),
        "top_stressors": analyze_orig("What are the major sources of stress in your student life? (Select all that apply)", is_multiselect=True),
        "dashboard_preference": analyze_orig("Which dashboard would you prefer?"),
        "desired_features": analyze_orig("Which features would you like in MindBridge Campus? (Select all that apply)", is_multiselect=True)
    }

    json_out_path = r'C:\Users\swarp\.gemini\antigravity\scratch\mindbridge-campus\data\survey_analysis.json'
    with open(json_out_path, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    print(f"Saved complete JSON analysis to: {json_out_path}")

    # Print high-level executive summary
    print("\n=== EXECUTIVE SURVEY FINDINGS ===")
    print(f"Total: {total_count} (Original: {orig_count}, Synthetic: {synth_count})")
    print("\nCommunication Preferences:")
    for k, v in analysis['communication_preference'].items():
        print(f"  - {k}: {v} ({v/total_count*100:.1f}%)")
    print("\nTop Desired Tracking Metrics:")
    for k, v in list(analysis['desired_tracking_metrics'].items())[:8]:
        print(f"  - {k}: {v} ({v/total_count*100:.1f}%)")
    print("\nTop Desired Features:")
    for k, v in list(analysis['desired_features'].items())[:8]:
        print(f"  - {k}: {v} ({v/total_count*100:.1f}%)")
    print("\nDashboard Preference:")
    for k, v in analysis['dashboard_preference'].items():
        print(f"  - {k}: {v} ({v/total_count*100:.1f}%)")
    print("\nCheck-in Frequency Preference:")
    for k, v in analysis['reminder_frequency'].items():
        print(f"  - {k}: {v} ({v/total_count*100:.1f}%)")
    print("\nTop Stressors:")
    for k, v in list(analysis['major_stressors'].items())[:8]:
        print(f"  - {k}: {v} ({v/total_count*100:.1f}%)")
    print("\nSleep Patterns:")
    for k, v in analysis['sleep_hours'].items():
        print(f"  - {k}: {v} ({v/total_count*100:.1f}%)")
    print("\nEnergy Deficiency Frequency (Tired during day):")
    for k, v in analysis['energy_deficiency_frequency'].items():
        print(f"  - {k}: {v} ({v/total_count*100:.1f}%)")

if __name__ == '__main__':
    run_analysis()
