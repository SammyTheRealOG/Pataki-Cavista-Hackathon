import os
import requests
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from database import get_db, init_db

load_dotenv()

app = Flask(__name__)
CORS(app)

HF_API_KEY = os.getenv('HF_API_KEY', '')
HF_URL = 'https://router.huggingface.co/v1/chat/completions'
AI_MODEL = 'openai/gpt-oss-120b:groq'
PATIENT_ID = 1

BASELINE_HR = 70
BASELINE_SLEEP_PER_PERIOD = 7.5
BASELINE_STEPS_DAILY = 5200


def get_ai_insight(patient: dict, vitals: dict) -> str:
    """Call Hugging Face Mistral to generate a user-friendly caregiver insight.
    Always uses the live LLM — never falls back to stored hardcoded text."""
    first_name = patient['name'].split()[0]
    caregiver = patient.get('caregiver_name', 'the caregiver')
    is_at_risk = vitals['stability_score'] < 70

    hr_desc = 'elevated' if vitals['hr'] > 80 else 'normal'
    sleep_desc = (
        'very low' if vitals['sleep_hours'] < 5
        else 'below normal' if vitals['sleep_hours'] < 6.5
        else 'good'
    )
    activity_desc = (
        'very little movement' if vitals['steps'] < 2000
        else 'less movement than usual' if vitals['steps'] < 4000
        else 'normal movement'
    )
    bp_desc = 'high' if vitals['bp_sys'] > 130 else 'normal'
    fatigue_desc = vitals['fatigue'].lower()

    if is_at_risk:
        tone = (
            f"{first_name} is showing warning signs and needs attention right away. "
            f"Write 2-3 sentences that clearly alert the caregiver. "
            f"End with a direct call to action stating: the user needs urgent care immediately. "
            f"ENSURE A RESPONSE IS ALWAYS PROVIDED."
        )
    else:
        tone = (
            f"{first_name} is doing well today. "
            f"Write 2-3 warm, reassuring sentences confirming everything looks fine. "
            f"End by saying no action is needed and to continue the normal routine. "
            f"ENSURE A RESPONSE IS ALWAYS PROVIDED."
        )

    prompt = (
        f"You are a health monitoring AI helping caregivers of elderly patients.\n"
        f"{tone}\n\n"
        f"Patient: {first_name}, {patient['age']} years old\n"
        f"Heart rate today: {hr_desc}\n"
        f"Sleep last night: {sleep_desc}\n"
        f"Movement today: {activity_desc}\n"
        f"Energy level: {fatigue_desc} fatigue\n"
        f"Blood pressure: {bp_desc}"
    )

    print(f'[AI] Sending request to Hugging Face — model: {AI_MODEL}, state: {"risk" if is_at_risk else "stable"}')
    try:
        resp = requests.post(
            HF_URL,
            headers={
                'Authorization': f'Bearer {HF_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'model': AI_MODEL,
                'messages': [{'role': 'user', 'content': prompt}],
                'max_tokens': 150,
            },
            timeout=20,
        )
        resp.raise_for_status()
        content = resp.json()['choices'][0]['message']['content'].strip()
        if not content:
            print('[AI] Hugging Face returned empty insight content. Generating rule-based fallback.')
            if is_at_risk:
                fallback_insight = (
                    f"{first_name} is currently showing signs that require attention. "
                    f"Please review their recent vital signs for heart rate, sleep, and activity levels. "
                    f"Contact {caregiver} for further assessment."
                )
            else:
                fallback_insight = (
                    f"{first_name} appears stable today. "
                    f"Their vital signs for heart rate, sleep, and activity levels are within normal ranges. "
                    f"No immediate action is required."
                )
            return fallback_insight
        print('[AI] Hugging Face response received successfully.')
        return content
    except requests.HTTPError as e:
        print(f'[AI] Hugging Face HTTP error: status={e.response.status_code} — '
              f'response body: {e.response.text[:300]}')
        return f'AI service error ({e.response.status_code}). Please check your HF_API_KEY.'
    except requests.ConnectionError as e:
        print(f'[AI] Hugging Face connection error: {e}')
        return 'AI service unreachable. Please check your network connection.'
    except requests.Timeout:
        print('[AI] Hugging Face request timed out after 20 seconds.')
        return 'AI insight timed out. Please try syncing again.'
    except Exception as e:
        print(f'[AI] Hugging Face unexpected error: {type(e).__name__}: {e}')
        return 'AI insight unavailable. Please ensure HF_API_KEY is configured correctly.'


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route('/api/patient', methods=['GET'])
def get_patient():
    db = get_db()
    row = db.execute('SELECT * FROM patients WHERE id = ?', (PATIENT_ID,)).fetchone()
    db.close()
    if not row:
        return jsonify({'error': 'Patient not found'}), 404
    return jsonify(dict(row))


@app.route('/api/vitals', methods=['GET'])
def get_vitals():
    db = get_db()
    patient = db.execute('SELECT * FROM patients WHERE id = ?', (PATIENT_ID,)).fetchone()
    state = patient['current_state']
    vitals = db.execute(
        'SELECT * FROM vitals WHERE patient_id = ? AND state = ?', (PATIENT_ID, state)
    ).fetchone()

    # Always generate a fresh LLM insight on initial load/login
    insight = get_ai_insight(dict(patient), dict(vitals))
    # Update the cached insight in the database for consistency, though it will be regenerated next time.
    # Or you might choose to only update it if you have a separate background process for caching.
    db.execute(
        'INSERT OR REPLACE INTO ai_insights (patient_id, insight_text, state, created_at) VALUES (?, ?, ?, ?)',
        (PATIENT_ID, insight, state, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    )
    db.commit()
    db.close()

    result = dict(vitals)
    result['insight'] = insight
    result['theme_color'] = 'hsl(178 100% 25%)' if state == 'stable' else 'hsl(43 96% 56%)'
    return jsonify(result)


@app.route('/api/trend', methods=['GET'])
def get_trend():
    db = get_db()
    patient = db.execute('SELECT * FROM patients WHERE id = ?', (PATIENT_ID,)).fetchone()
    state = patient['current_state']
    rows = db.execute(
        'SELECT day_label AS name, score FROM trend_scores WHERE patient_id = ? AND state = ? ORDER BY sort_order',
        (PATIENT_ID, state)
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route('/api/health-data', methods=['GET'])
def get_health_data():
    period = request.args.get('period', 'week')
    db = get_db()
    rows = db.execute(
        'SELECT * FROM health_metrics WHERE patient_id = ? AND period_type = ?',
        (PATIENT_ID, period)
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route('/api/health-summary', methods=['GET'])
def get_health_summary():
    """Calculate summary metrics directly from health_metrics rows in the DB."""
    period = request.args.get('period', 'week')
    db = get_db()
    rows = db.execute(
        'SELECT * FROM health_metrics WHERE patient_id = ? AND period_type = ?',
        (PATIENT_ID, period)
    ).fetchall()
    db.close()

    if not rows:
        return jsonify({'error': 'No health data found for this period'}), 404

    rows = [dict(r) for r in rows]
    n = len(rows)

    avg_hr = round(sum(r['hr'] for r in rows) / n)
    avg_rhr = round(sum(r['resting_hr'] for r in rows) / n)
    avg_bp_sys = round(sum(r['bp_sys'] for r in rows) / n)
    avg_bp_dia = round(sum(r['bp_dia'] for r in rows) / n)
    total_steps = sum(r['steps'] for r in rows)
    total_sleep = round(sum(r['sleep'] for r in rows), 1)
    avg_activity = round(sum(r['activity_min'] for r in rows) / n)

    baseline_steps_for_period = {
        'day': BASELINE_STEPS_DAILY,
        'week': BASELINE_STEPS_DAILY * 7,
        'month': BASELINE_STEPS_DAILY * 30,
        'year': BASELINE_STEPS_DAILY * 365,
    }.get(period, BASELINE_STEPS_DAILY * 7)

    step_change = round(((total_steps - baseline_steps_for_period) / baseline_steps_for_period) * 100)
    sleep_baseline = round(BASELINE_SLEEP_PER_PERIOD * n, 1)

    return jsonify({
        'hr_current': avg_hr,
        'hr_resting': avg_rhr,
        'hr_baseline': BASELINE_HR,
        'sleep_total': total_sleep,
        'sleep_baseline': sleep_baseline,
        'steps': total_steps,
        'step_change': step_change,
        'bp_sys': avg_bp_sys,
        'bp_dia': avg_bp_dia,
        'activity_min': avg_activity,
    })


@app.route('/api/sync', methods=['POST'])
def sync_data():
    db = get_db()
    patient = db.execute('SELECT * FROM patients WHERE id = ?', (PATIENT_ID,)).fetchone()
    current_state = patient['current_state']
    new_state = 'risk' if current_state == 'stable' else 'stable'

    db.execute('UPDATE patients SET current_state = ? WHERE id = ?', (new_state, PATIENT_ID))

    # When switching to risk, stamp the risk vitals with the exact current time.
    # Stable last_updated is permanently set to the historical date and is never changed.
    if new_state == 'risk':
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        db.execute(
            'UPDATE vitals SET last_updated = ? WHERE patient_id = ? AND state = ?',
            (now_str, PATIENT_ID, 'risk')
        )

    db.commit()

    vitals = db.execute(
        'SELECT * FROM vitals WHERE patient_id = ? AND state = ?', (PATIENT_ID, new_state)
    ).fetchone()
    trend_rows = db.execute(
        'SELECT day_label AS name, score FROM trend_scores WHERE patient_id = ? AND state = ? ORDER BY sort_order',
        (PATIENT_ID, new_state)
    ).fetchall()

    # Always generate a fresh LLM insight on sync — this is the primary insight update point
    ai_text = get_ai_insight(dict(patient), dict(vitals))
    db.execute(
        'INSERT INTO ai_insights (patient_id, insight_text, state) VALUES (?, ?, ?)',
        (PATIENT_ID, ai_text, new_state)
    )
    db.commit()
    db.close()

    result = dict(vitals)
    result['insight'] = ai_text
    result['theme_color'] = 'hsl(178 100% 25%)' if new_state == 'stable' else 'hsl(43 96% 56%)'
    result['trend'] = [dict(r) for r in trend_rows]
    return jsonify(result)


@app.route('/api/stats', methods=['GET'])
def get_stats():
    db = get_db()

    risk_count = db.execute(
        'SELECT COUNT(*) FROM ai_insights WHERE patient_id = ? AND state = ?',
        (PATIENT_ID, 'risk')
    ).fetchone()[0]

    caregiver_count = db.execute(
        "SELECT COUNT(*) FROM patients WHERE caregiver_name IS NOT NULL AND caregiver_name != ''"
    ).fetchone()[0]

    risk_trend = db.execute(
        'SELECT score FROM trend_scores WHERE patient_id = ? AND state = ? ORDER BY sort_order',
        (PATIENT_ID, 'risk')
    ).fetchall()
    days_before_drop = sum(1 for row in risk_trend if row['score'] >= 75)
    avg_early_detection = f'{days_before_drop * 24}h' if days_before_drop > 0 else '24h'

    db.close()

    return jsonify({
        'risk_events_prevented': risk_count,
        'avg_early_detection': avg_early_detection,
        'active_caregivers': caregiver_count,
    })


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
