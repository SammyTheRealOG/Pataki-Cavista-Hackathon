import { useState } from 'react';
import { motion } from 'motion/react';
import { HeartPulse, BedDouble, Footprints, Activity as ActivityIcon, Gauge, Timer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import AppShell from '@/components/layout/AppShell';

type Period = 'day' | 'week' | 'month' | 'year';

const periodLabels: Record<Period, string[]> = {
  day: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
  week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  month: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  year: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const generateData = (period: Period) => {
  const labels = periodLabels[period];
  const seed = period === 'day' ? 1 : period === 'week' ? 2 : period === 'month' ? 3 : 4;
  return labels.map((name, i) => ({
    name,
    hr: 65 + Math.round(Math.sin(i * seed) * 12 + Math.random() * 5),
    restingHr: 58 + Math.round(Math.sin(i + 1) * 4),
    bp_sys: 118 + Math.round(Math.sin(i * seed) * 8),
    bp_dia: 76 + Math.round(Math.cos(i * seed) * 5),
    steps: 4000 + Math.round(Math.sin(i * 0.8) * 2500 + Math.random() * 1000),
    sleep: +(6.5 + Math.sin(i * 0.7) * 1.5 + Math.random() * 0.5).toFixed(1),
    activityMin: 25 + Math.round(Math.sin(i) * 15 + Math.random() * 10),
  }));
};

const summaryData: Record<Period, { hrCurrent: number; hrResting: number; hrBaseline: number; sleepTotal: number; sleepBaseline: number; steps: number; stepChange: number }> = {
  day: { hrCurrent: 72, hrResting: 58, hrBaseline: 70, sleepTotal: 7.2, sleepBaseline: 7.5, steps: 5200, stepChange: 4 },
  week: { hrCurrent: 74, hrResting: 59, hrBaseline: 70, sleepTotal: 49.8, sleepBaseline: 52.5, steps: 38400, stepChange: -3 },
  month: { hrCurrent: 71, hrResting: 57, hrBaseline: 70, sleepTotal: 210, sleepBaseline: 225, steps: 156000, stepChange: 2 },
  year: { hrCurrent: 70, hrResting: 58, hrBaseline: 70, sleepTotal: 2628, sleepBaseline: 2737, steps: 1900000, stepChange: 5 },
};

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
  const chartData = generateData(period);
  const summary = summaryData[period];

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Health Data</h2>
            <p className="text-sm text-muted-foreground">Esther Wanjiku · Simulated wearable data overview</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <MetricCard icon={<HeartPulse size={22} className="text-danger" />} label="Heart Rate" value={summary.hrCurrent} unit="bpm" sub={`Resting: ${summary.hrResting} · Baseline: ${summary.hrBaseline}`} />
          <MetricCard icon={<BedDouble size={22} className="text-primary" />} label="Sleep Summary" value={summary.sleepTotal} unit="h" sub={`Baseline: ${summary.sleepBaseline}h`} />
          <MetricCard icon={<Footprints size={22} className="text-success" />} label="Daily Activity" value={summary.steps.toLocaleString()} unit="steps" sub={`${summary.stepChange > 0 ? '+' : ''}${summary.stepChange}% from average`} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Heart Rate Chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-base font-bold text-card-foreground mb-1">Heart Rate</h3>
            <p className="text-xs text-muted-foreground mb-4">Current & Resting HR over time</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} domain={[50, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="hr" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} name="Heart Rate" />
                  <Line type="monotone" dataKey="restingHr" stroke="hsl(178 100% 25%)" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Resting HR" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Blood Pressure Chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-base font-bold text-card-foreground mb-1">Blood Pressure</h3>
            <p className="text-xs text-muted-foreground mb-4">Systolic / Diastolic trends</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} domain={[60, 140]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bp_sys" stroke="hsl(43 96% 56%)" strokeWidth={2} dot={false} name="Systolic" />
                  <Line type="monotone" dataKey="bp_dia" stroke="hsl(152 60% 42%)" strokeWidth={2} dot={false} name="Diastolic" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Steps Chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-base font-bold text-card-foreground mb-1">Step Count</h3>
            <p className="text-xs text-muted-foreground mb-4">Daily movement tracking</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="steps" stroke="hsl(152 60% 42%)" fill="hsl(152 60% 42% / 0.15)" strokeWidth={2} name="Steps" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sleep Duration Chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-base font-bold text-card-foreground mb-1">Sleep Duration</h3>
            <p className="text-xs text-muted-foreground mb-4">Hours of sleep per period</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215 14% 50%)' }} domain={[4, 10]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sleep" stroke="hsl(178 100% 25%)" fill="hsl(178 100% 25% / 0.1)" strokeWidth={2} name="Sleep (h)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Metric Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: <HeartPulse size={18} className="text-danger" />, label: 'Heart Rate', value: `${summary.hrCurrent} bpm` },
            { icon: <HeartPulse size={18} className="text-primary" />, label: 'Resting HR', value: `${summary.hrResting} bpm` },
            { icon: <Gauge size={18} className="text-warning" />, label: 'Blood Pressure', value: '118/76 mmHg' },
            { icon: <Footprints size={18} className="text-success" />, label: 'Step Count', value: summary.steps.toLocaleString() },
            { icon: <BedDouble size={18} className="text-primary" />, label: 'Sleep Duration', value: `${summary.sleepTotal}h` },
            { icon: <Timer size={18} className="text-accent-foreground" />, label: 'Activity Min', value: '42 min' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">{icon}</div>
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className="text-sm font-bold text-card-foreground">{value}</p>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
};

export default Data;
