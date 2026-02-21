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

    # --- Vitals for stable & risk ---
    c.execute(
        '''INSERT INTO vitals (patient_id, state, hr, sleep_hours, steps, fatigue,
           stability_score, status, bp_sys, bp_dia, resting_hr, activity_min)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (patient_id, 'stable', 70, 7.5, 5200, 'Low', 92, 'Stable', 118, 76, 58, 42)
    )
    c.execute(
        '''INSERT INTO vitals (patient_id, state, hr, sleep_hours, steps, fatigue,
           stability_score, status, bp_sys, bp_dia, resting_hr, activity_min)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (patient_id, 'risk', 88, 4.1, 1200, 'High', 42, 'High Risk', 135, 88, 75, 12)
    )

    # --- Trend scores ---
    stable_trend = [
        ('Mon', 85, 0), ('Tue', 88, 1), ('Wed', 90, 2), ('Thu', 91, 3),
        ('Fri', 92, 4), ('Sat', 92, 5), ('Sun', 92, 6),
    ]
    risk_trend = [
        ('Mon', 85, 0), ('Tue', 88, 1), ('Wed', 90, 2), ('Thu', 82, 3),
        ('Fri', 68, 4), ('Sat', 55, 5), ('Sun', 42, 6),
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
    day_data = [
        ('6am',  72, 58, 118, 76, 3200,  6.2, 15),
        ('8am',  75, 59, 120, 77, 3500,  6.2, 20),
        ('10am', 78, 60, 119, 78, 4200,  6.2, 30),
        ('12pm', 80, 59, 121, 76, 4800,  6.2, 35),
        ('2pm',  76, 58, 118, 75, 5200,  6.2, 38),
        ('4pm',  74, 58, 117, 76, 5800,  6.2, 42),
        ('6pm',  73, 57, 118, 76, 6200,  6.2, 45),
        ('8pm',  70, 57, 116, 75, 6500,  6.2, 42),
        ('10pm', 68, 56, 115, 74, 6600,  7.2, 42),
    ]
    week_data = [
        ('Mon', 68, 56, 116, 74, 5500, 7.8, 35),
        ('Tue', 72, 58, 118, 76, 5200, 7.5, 40),
        ('Wed', 74, 59, 120, 77, 4800, 7.2, 38),
        ('Thu', 70, 57, 117, 75, 5400, 7.6, 42),
        ('Fri', 76, 60, 122, 78, 4200, 6.8, 30),
        ('Sat', 69, 57, 116, 74, 6100, 8.2, 50),
        ('Sun', 67, 56, 115, 73, 5200, 8.5, 25),
    ]
    month_data = [
        ('Week 1', 72, 58, 119, 76, 38500, 52.5, 42),
        ('Week 2', 71, 57, 118, 75, 37200, 51.8, 40),
        ('Week 3', 73, 59, 120, 77, 39800, 53.2, 45),
        ('Week 4', 70, 57, 117, 74, 40500, 52.8, 38),
    ]
    year_data = [
        ('Jan', 74, 59, 121, 77, 162000, 220.0, 38),
        ('Feb', 72, 58, 119, 76, 155000, 210.0, 40),
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
        ('day',   72, 58, 70,  7.2,   7.5,    5200,    4,  118, 76, 42),
        ('week',  74, 59, 70, 49.8,  52.5,   38400,   -3,  118, 76, 40),
        ('month', 71, 57, 70, 210.0, 225.0, 156000,    2,  118, 76, 41),
        ('year',  70, 58, 70, 2628.0, 2737.0, 1900000, 5,  118, 76, 40),
    ]
    for pt, hrc, hrr, hrb, st, sb, steps, sc, bps, bpd, act in summaries:
        c.execute(
            '''INSERT INTO period_summaries
               (patient_id, period_type, hr_current, hr_resting, hr_baseline,
                sleep_total, sleep_baseline, steps, step_change, bp_sys, bp_dia, activity_min)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (patient_id, pt, hrc, hrr, hrb, st, sb, steps, sc, bps, bpd, act)
        )

    # --- Seed AI insights ---
    c.execute(
        'INSERT INTO ai_insights (patient_id, insight_text, state) VALUES (?, ?, ?)',
        (patient_id,
         'All vital signs are within normal range. Heart rate, sleep, and activity levels are consistent '
         'with the patient baseline. No anomalies detected in the past 48 hours.',
         'stable')
    )
    c.execute(
        'INSERT INTO ai_insights (patient_id, insight_text, state) VALUES (?, ?, ?)',
        (patient_id,
         '⚠ Warning: 75% drop in daily activity and sleep deficit of 3.4 hours detected. '
         'Heart rate is 26% above baseline. These patterns strongly correlate with pre-clinical '
         'decline. Caregiver intervention recommended immediately.',
         'risk')
    )

    conn.commit()
    conn.close()
    print('Database initialized and seeded.')
