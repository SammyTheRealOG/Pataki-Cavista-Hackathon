import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'pataki.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()

    c.executescript('''
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER,
            address TEXT,
            device_name TEXT,
            device_status TEXT,
            device_battery TEXT,
            caregiver_name TEXT,
            caregiver_relationship TEXT,
            caregiver_phone TEXT,
            caregiver_email TEXT,
            current_state TEXT DEFAULT 'stable'
        );

        CREATE TABLE IF NOT EXISTS vitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            state TEXT,
            hr INTEGER,
            sleep_hours REAL,
            steps INTEGER,
            fatigue TEXT,
            stability_score INTEGER,
            status TEXT,
            bp_sys INTEGER,
            bp_dia INTEGER,
            resting_hr INTEGER,
            activity_min INTEGER,
            last_updated TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        );

        CREATE TABLE IF NOT EXISTS trend_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            state TEXT,
            day_label TEXT,
            score INTEGER,
            sort_order INTEGER,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        );

        CREATE TABLE IF NOT EXISTS health_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            period_type TEXT,
            label TEXT,
            hr INTEGER,
            resting_hr INTEGER,
            bp_sys INTEGER,
            bp_dia INTEGER,
            steps INTEGER,
            sleep REAL,
            activity_min INTEGER,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        );

        CREATE TABLE IF NOT EXISTS period_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            period_type TEXT,
            hr_current INTEGER,
            hr_resting INTEGER,
            hr_baseline INTEGER,
            sleep_total REAL,
            sleep_baseline REAL,
            steps INTEGER,
            step_change INTEGER,
            bp_sys INTEGER,
            bp_dia INTEGER,
            activity_min INTEGER,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        );

        CREATE TABLE IF NOT EXISTS ai_insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            insight_text TEXT,
            state TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        );
    ''')

    # Skip seeding if already done
    if c.execute('SELECT COUNT(*) FROM patients').fetchone()[0] > 0:
        conn.close()
        return

    # --- Patient ---
    c.execute(
        '''INSERT INTO patients
           (name, age, address, device_name, device_status, device_battery,
            caregiver_name, caregiver_relationship, caregiver_phone, caregiver_email, current_state)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        ('Esther Wanjiku', 78, '14 Riverside Dr, Nairobi, Kenya',
         'Fitbit Sense 2', 'Connected', '72%',
         'Amina Odhiambo', 'Daughter', '+254 712 345 678', 'amina.o@email.com', 'stable')
    )
    patient_id = c.lastrowid

    # --- Vitals ---
    # Stable state snapshot: recorded Thu Feb 19, 2026 (3 days ago)
    c.execute(
        '''INSERT INTO vitals (patient_id, state, hr, sleep_hours, steps, fatigue,
           stability_score, status, bp_sys, bp_dia, resting_hr, activity_min, last_updated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (patient_id, 'stable', 70, 7.5, 5200, 'Low', 92, 'Stable', 118, 76, 58, 42,
         '2026-02-19 10:23:00')
    )
    # Risk state snapshot: today Feb 22, 2026 — timestamp updated dynamically on sync
    c.execute(
        '''INSERT INTO vitals (patient_id, state, hr, sleep_hours, steps, fatigue,
           stability_score, status, bp_sys, bp_dia, resting_hr, activity_min, last_updated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (patient_id, 'risk', 88, 4.1, 1200, 'High', 42, 'High Risk', 135, 88, 75, 12,
         '2026-02-22 09:00:00')
    )

    # --- Trend scores ---
    # Stable trend: 7 days ending Feb 19 (Feb 13–19) — consistently healthy
    stable_trend = [
        ('Thu', 88, 0), ('Fri', 89, 1), ('Sat', 90, 2), ('Sun', 91, 3),
        ('Mon', 92, 4), ('Tue', 92, 5), ('Wed', 92, 6),
    ]
    # Risk trend: 7 days ending today Feb 22 (Feb 16–22) — stable Mon–Thu, sharp decline Fri–Sun
    risk_trend = [
        ('Mon', 91, 0), ('Tue', 91, 1), ('Wed', 90, 2), ('Thu', 89, 3),
        ('Fri', 72, 4), ('Sat', 55, 5), ('Sun', 42, 6),
    ]
    for label, score, order in stable_trend:
        c.execute(
            'INSERT INTO trend_scores (patient_id, state, day_label, score, sort_order) VALUES (?, ?, ?, ?, ?)',
            (patient_id, 'stable', label, score, order)
        )
    for label, score, order in risk_trend:
        c.execute(
            'INSERT INTO trend_scores (patient_id, state, day_label, score, sort_order) VALUES (?, ?, ?, ?, ?)',
            (patient_id, 'risk', label, score, order)
        )

    # --- Health metrics ---
    # Day view: intraday data for today (Feb 22, risk day) — elevated throughout
    day_data = [
        ('6am',  83, 70, 128, 84,  180, 4.1,  0),
        ('8am',  85, 72, 131, 85,  380, 4.1,  5),
        ('10am', 87, 73, 133, 87,  680, 4.1,  8),
        ('12pm', 88, 74, 135, 88,  900, 4.1, 10),
        ('2pm',  89, 75, 136, 88, 1050, 4.1, 11),
        ('4pm',  88, 75, 135, 88, 1150, 4.1, 12),
        ('6pm',  87, 74, 134, 87, 1200, 4.1, 12),
        ('8pm',  86, 73, 133, 86, 1200, 4.1, 12),
        ('10pm', 85, 72, 132, 85, 1200, 4.1, 12),
    ]
    # Week view: Mon Feb 16 → Sun Feb 22
    # Mon–Thu stable, Thu Feb 19 = last stable snapshot, Fri onward declining
    week_data = [
        ('Mon', 69, 57, 117, 75, 5400, 7.7, 41),   # Feb 16 — stable
        ('Tue', 71, 58, 118, 76, 5200, 7.5, 42),   # Feb 17 — stable
        ('Wed', 70, 57, 118, 75, 5100, 7.6, 40),   # Feb 18 — stable
        ('Thu', 73, 58, 120, 77, 4900, 7.3, 38),   # Feb 19 — stable snapshot (3 days ago)
        ('Fri', 78, 65, 126, 82, 3100, 5.8, 22),   # Feb 20 — notable decline
        ('Sat', 84, 71, 131, 86, 1900, 4.5, 14),   # Feb 21 — significant decline
        ('Sun', 88, 75, 135, 88, 1200, 4.1, 12),   # Feb 22 — risk (today)
    ]
    # Month view: Feb 2026 by week
    # Weeks 1–2 fully stable, Week 3 mostly stable with last 2 days declining, Week 4 = today
    month_data = [
        ('Week 1', 70, 57, 118, 75, 36400, 52.5, 42),  # Feb 1–7: all stable
        ('Week 2', 71, 58, 119, 76, 36400, 52.5, 41),  # Feb 8–14: all stable
        ('Week 3', 72, 59, 120, 77, 32200, 49.1, 36),  # Feb 15–21: 5 stable + 2 declining
        ('Week 4', 88, 75, 135, 88,  1200,  4.1, 12),  # Feb 22: today, risk
    ]
    year_data = [
        ('Jan', 70, 57, 118, 75, 162000, 225.0, 42),
        ('Feb', 73, 60, 121, 78, 142600, 210.7, 39),  # Partial month — ends risk
        ('Mar', 70, 57, 118, 75, 168000, 225.0, 42),
        ('Apr', 71, 57, 117, 74, 160000, 218.0, 41),
        ('May', 73, 59, 120, 77, 172000, 228.0, 45),
        ('Jun', 69, 56, 116, 73, 165000, 222.0, 43),
        ('Jul', 68, 55, 115, 73, 170000, 230.0, 44),
        ('Aug', 70, 57, 118, 75, 158000, 212.0, 40),
        ('Sep', 72, 58, 119, 76, 163000, 220.0, 42),
        ('Oct', 71, 57, 117, 74, 160000, 215.0, 39),
        ('Nov', 73, 59, 121, 77, 155000, 208.0, 38),
        ('Dec', 70, 57, 118, 75, 150000, 200.0, 35),
    ]

    for period_type, rows in [('day', day_data), ('week', week_data),
                               ('month', month_data), ('year', year_data)]:
        for label, hr, rhr, bps, bpd, steps, sleep, act in rows:
            c.execute(
                '''INSERT INTO health_metrics
                   (patient_id, period_type, label, hr, resting_hr, bp_sys, bp_dia, steps, sleep, activity_min)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (patient_id, period_type, label, hr, rhr, bps, bpd, steps, sleep, act)
            )

    # --- Period summaries ---
    summaries = [
        ('day',   87, 73, 70,  4.1,   7.5,    1200,  -77, 133, 87, 10),
        ('week',  77, 65, 70, 46.5,  52.5,   27000,  -26, 123, 81, 29),
        ('month', 72, 60, 70, 158.2, 225.0, 106200,  -42, 121, 79, 38),
        ('year',  71, 58, 70, 2390.7, 2737.0, 1825600, -8, 118, 76, 40),
    ]
    for pt, hrc, hrr, hrb, st, sb, steps, sc, bps, bpd, act in summaries:
        c.execute(
            '''INSERT INTO period_summaries
               (patient_id, period_type, hr_current, hr_resting, hr_baseline,
                sleep_total, sleep_baseline, steps, step_change, bp_sys, bp_dia, activity_min)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (patient_id, pt, hrc, hrr, hrb, st, sb, steps, sc, bps, bpd, act)
        )

    # No pre-seeded AI insights — always generated live by the LLM

    conn.commit()
    conn.close()
    print('Database initialized and seeded.')
