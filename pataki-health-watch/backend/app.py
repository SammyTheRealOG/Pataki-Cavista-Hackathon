import os
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from database import get_db, init_db

load_dotenv()

app = Flask(__name__)
CORS(app)

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
AI_MODEL = 'meta-llama/llama-3.1-8b-instruct:free'
PATIENT_ID = 1


def get_ai_insight(patient: dict, vitals: dict) -> str | None:
    """Call OpenRouter to generate a concise health assessment. Returns None on failure."""
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == 'your_openrouter_api_key_here':
        return None

    baseline_hr = 70
    baseline_sleep = 7.5
    baseline_steps = 5200

    hr_pct = ((vitals['hr'] - baseline_hr) / baseline_hr) * 100
    sleep_pct = ((vitals['sleep_hours'] - baseline_sleep) / baseline_sleep) * 100
    steps_pct = ((vitals['steps'] - baseline_steps) / baseline_steps) * 100

    prompt = (
        f"You are a health monitoring AI for elderly patients. "
        f"Analyze the vitals below and write a 2-3 sentence assessment. "
        f"Be direct and specific: if stable, confirm it; if concerning, name the exact risk and the action needed. "
        f"Do not use vague language.\n\n"
        f"Patient: {patient['name']}, Age {patient['age']}\n"
        f"Status: {vitals['status']} | Stability Score: {vitals['stability_score']}/100\n"
        f"Heart Rate: {vitals['hr']} bpm (baseline 70 bpm, {hr_pct:+.0f}%)\n"
        f"Sleep: {vitals['sleep_hours']}h (baseline 7.5h, {sleep_pct:+.0f}%)\n"
        f"Steps: {vitals['steps']} (baseline 5200, {steps_pct:+.0f}%)\n"
        f"Fatigue: {vitals['fatigue']}\n"
        f"Blood Pressure: {vitals['bp_sys']}/{vitals['bp_dia']} mmHg"
    )

    try:
        resp = requests.post(
            OPENROUTER_URL,
            headers={
                'Authorization': f'Bearer {OPENROUTER_API_KEY}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:8080',
                'X-Title': 'Pataki Health Watch',
            },
            json={
                'model': AI_MODEL,
                'messages': [{'role': 'user', 'content': prompt}],
                'max_tokens': 150,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f'OpenRouter error: {e}')
        return None


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
    insight_row = db.execute(
        'SELECT insight_text FROM ai_insights WHERE patient_id = ? AND state = ? ORDER BY created_at DESC LIMIT 1',
        (PATIENT_ID, state)
    ).fetchone()
    db.close()

    result = dict(vitals)
    result['insight'] = insight_row['insight_text'] if insight_row else 'No insight available.'
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
    period = request.args.get('period', 'week')
    db = get_db()
    row = db.execute(
        'SELECT * FROM period_summaries WHERE patient_id = ? AND period_type = ?',
        (PATIENT_ID, period)
    ).fetchone()
    db.close()
    if not row:
        return jsonify({'error': 'Summary not found'}), 404
    return jsonify(dict(row))


@app.route('/api/sync', methods=['POST'])
def sync_data():
    db = get_db()
    patient = db.execute('SELECT * FROM patients WHERE id = ?', (PATIENT_ID,)).fetchone()
    current_state = patient['current_state']
    new_state = 'risk' if current_state == 'stable' else 'stable'

    db.execute('UPDATE patients SET current_state = ? WHERE id = ?', (new_state, PATIENT_ID))
    db.commit()

    vitals = db.execute(
        'SELECT * FROM vitals WHERE patient_id = ? AND state = ?', (PATIENT_ID, new_state)
    ).fetchone()
    trend_rows = db.execute(
        'SELECT day_label AS name, score FROM trend_scores WHERE patient_id = ? AND state = ? ORDER BY sort_order',
        (PATIENT_ID, new_state)
    ).fetchall()

    # Try live AI insight, fall back to stored
    ai_text = get_ai_insight(dict(patient), dict(vitals))
    if ai_text:
        db.execute(
            'INSERT INTO ai_insights (patient_id, insight_text, state) VALUES (?, ?, ?)',
            (PATIENT_ID, ai_text, new_state)
        )
        db.commit()
    else:
        fallback = db.execute(
            'SELECT insight_text FROM ai_insights WHERE patient_id = ? AND state = ? ORDER BY created_at DESC LIMIT 1',
            (PATIENT_ID, new_state)
        ).fetchone()
        ai_text = fallback['insight_text'] if fallback else 'No insight available.'

    db.close()

    result = dict(vitals)
    result['insight'] = ai_text
    result['theme_color'] = 'hsl(178 100% 25%)' if new_state == 'stable' else 'hsl(43 96% 56%)'
    result['trend'] = [dict(r) for r in trend_rows]
    return jsonify(result)


@app.route('/api/stats', methods=['GET'])
def get_stats():
    return jsonify({
        'risk_events_prevented': 12,
        'avg_early_detection': '48h',
        'active_caregivers': 3,
    })


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
