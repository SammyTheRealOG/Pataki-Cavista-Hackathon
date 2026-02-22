import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HeartPulse, BedDouble, Footprints, Gauge, Timer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import AppShell from '@/components/layout/AppShell';

type Period = 'day' | 'week' | 'month' | 'year';

interface Metric {
  label: string;
  hr: number;
  resting_hr: number;
  bp_sys: number;
  bp_dia: number;
  steps: number;
  sleep: number;
  activity_min: number;
}

interface Summary {
  hr_current: number;
  hr_resting: number;
  hr_baseline: number;
  sleep_total: number;
  sleep_baseline: number;
  steps: number;
  step_change: number;
  bp_sys: number;
  bp_dia: number;
  activity_min: number;
}

const MetricCard = ({ icon, label, value, unit, sub }: { icon: React.ReactNode; label: string; value: string | number; unit?: string; sub?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4"
  >
    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">{icon}</div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-card-foreground">
        {value} {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  </motion.div>
);

const Data = () => {
  const [period, setPeriod] = useState<Period>('week');
  const [chartData, setChartData] = useState<Metric[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [metricsRes, summaryRes, patientRes] = await Promise.all([
          fetch(`/api/health-data?period=${period}`),
          fetch(`/api/health-summary?period=${period}`),
          fetch('/api/patient'),
        ]);
        setChartData(await metricsRes.json());
        setSummary(await summaryRes.json());
        const patient = await patientRes.json();
        setPatientName(patient.name);
      } catch (err) {
        console.error('Failed to load health data:', err);
      }
    };
    load();
  }, [period]);

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Health Data</h2>
            <p className="text-sm text-muted-foreground">{patientName} · Wearable data overview</p>
          </div>
          <div className="flex bg-muted rounded-xl p-1 gap-1">
            {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
                  period === p ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <MetricCard
              icon={<HeartPulse size={22} className="text-danger" />}
              label="Average Heart Rate"
              value={summary.hr_current}
              unit="bpm"
              sub={`Resting: ${summary.hr_resting} · Baseline: ${summary.hr_baseline}`}
            />
            <MetricCard
              icon={<BedDouble size={22} className="text-primary" />}
              label="Average Sleep Summary"
              value={summary.sleep_total}
              unit="h"
              sub={`Baseline: ${summary.sleep_baseline}h`}
            />
            <MetricCard
              icon={<Footprints size={22} className="text-success" />}
              label="Average Daily Activity"
              value={summary.steps.toLocaleString()}
              unit="steps"
              sub={`${summary.step_change > 0 ? '+' : ''}${summary.step_change}% from average`}
            />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Heart Rate Chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-base font-bold text-card-foreground mb-1">Heart Rate</h3>
            <p className="text-xs text-muted-foreground mb-4">Current & Resting HR over time (Average)</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} domain={[50, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="hr" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} name="Avg. Heart Rate" />
                  <Line type="monotone" dataKey="resting_hr" stroke="hsl(178 100% 25%)" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Avg. Resting HR" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Blood Pressure Chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-base font-bold text-card-foreground mb-1">Blood Pressure</h3>
            <p className="text-xs text-muted-foreground mb-4">Systolic / Diastolic trends (Average)</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} domain={[60, 140]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bp_sys" stroke="hsl(43 96% 56%)" strokeWidth={2} dot={false} name="Avg. Systolic" />
                  <Line type="monotone" dataKey="bp_dia" stroke="hsl(152 60% 42%)" strokeWidth={2} dot={false} name="Avg. Diastolic" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Steps Chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-base font-bold text-card-foreground mb-1">Step Count</h3>
            <p className="text-xs text-muted-foreground mb-4">Daily movement tracking (Average)</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="steps" stroke="hsl(152 60% 42%)" fill="hsl(152 60% 42% / 0.15)" strokeWidth={2} name="Avg. Steps" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sleep Duration Chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-base font-bold text-card-foreground mb-1">Sleep Duration</h3>
            <p className="text-xs text-muted-foreground mb-4">Hours of sleep per period (Average)</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} domain={[4, 10]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sleep" stroke="hsl(178 100% 25%)" fill="hsl(178 100% 25% / 0.1)" strokeWidth={2} name="Avg. Sleep (h)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Metric Row */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: <HeartPulse size={18} className="text-danger" />, label: 'Avg. Heart Rate', value: `${summary.hr_current} bpm` },
              { icon: <HeartPulse size={18} className="text-primary" />, label: 'Avg. Resting HR', value: `${summary.hr_resting} bpm` },
              { icon: <Gauge size={18} className="text-warning" />, label: 'Avg. Blood Pressure', value: `${summary.bp_sys}/${summary.bp_dia} mmHg` },
              { icon: <Footprints size={18} className="text-success" />, label: 'Avg. Step Count', value: summary.steps.toLocaleString() },
              { icon: <BedDouble size={18} className="text-primary" />, label: 'Avg. Sleep Duration', value: `${summary.sleep_total}h` },
              { icon: <Timer size={18} className="text-accent-foreground" />, label: 'Avg. Activity Min', value: `${summary.activity_min} min` },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2">{icon}</div>
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="text-sm font-bold text-card-foreground">{value}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
};

export default Data;
