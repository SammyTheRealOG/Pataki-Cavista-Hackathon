import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import AppShell from '@/components/layout/AppShell';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import IntelligenceGauge from '@/components/dashboard/IntelligenceGauge';
import VitalsCard from '@/components/dashboard/VitalsCard';
import InsightCard from '@/components/dashboard/InsightCard';
import TrendGraph from '@/components/dashboard/TrendGraph';
import LoadingOverlay from '@/components/dashboard/LoadingOverlay';
import { Shield, Clock, Users } from 'lucide-react';

const baselineState = {
  status: 'Stable',
  score: 92,
  vitals: { hr: 70, sleep: 7.5, steps: 5200, fatigue: 'Low' },
  insight: 'System monitoring active. All behavioral patterns are consistent with the user baseline. No anomalies detected in the past 48 hours.',
  themeColor: 'hsl(178 100% 25%)',
};

const riskState = {
  status: 'High Risk',
  score: 42,
  vitals: { hr: 88, sleep: 4.1, steps: 1200, fatigue: 'High' },
  insight: '⚠ Critical Warning: 75% drop in daily activity and a 2-day cumulative sleep deficit detected. Heart rate elevated 25% above baseline. These patterns strongly correlate with pre-clinical decline episodes. Immediate caregiver intervention recommended.',
  themeColor: 'hsl(43 96% 56%)',
};

const initialChartData = [
  { name: 'Mon', score: 85 },
  { name: 'Tue', score: 88 },
  { name: 'Wed', score: 90 },
  { name: 'Thu', score: 91 },
  { name: 'Fri', score: 92 },
  { name: 'Sat', score: 92 },
  { name: 'Sun', score: 92 },
];

const riskChartData = [
  { name: 'Mon', score: 85 },
  { name: 'Tue', score: 88 },
  { name: 'Wed', score: 90 },
  { name: 'Thu', score: 82 },
  { name: 'Fri', score: 68 },
  { name: 'Sat', score: 55 },
  { name: 'Sun', score: 42 },
];

const Index = () => {
  const [appState, setAppState] = useState(baselineState);
  const [chartData, setChartData] = useState(initialChartData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [caregiverNotified, setCaregiverNotified] = useState(false);
  const [hospitalAlerted, setHospitalAlerted] = useState(false);
  const patientName = "Esther Wanjiku";

  const handleSync = () => {
    setIsLoading(true);
    setCaregiverNotified(false);
    setHospitalAlerted(false);
    setTimeout(() => {
      const targetState = appState.status === 'Stable' ? riskState : baselineState;
      setAppState(targetState);
      setChartData(targetState.status === 'High Risk' ? riskChartData : initialChartData);
      setIsSynced(true);
      setIsLoading(false);
    }, 2500);
  };

  const isRiskState = appState.status === 'High Risk';

  return (
    <AppShell>
      <DashboardHeader
        patientName={patientName}
        onSync={handleSync}
        isSynced={isSynced}
        isLoading={isLoading}
      />

      <AnimatePresence>{isLoading && <LoadingOverlay />}</AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Status banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={appState.status}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-8 p-4 rounded-2xl border flex items-center gap-4 ${
              isRiskState
                ? 'bg-danger/5 border-danger/20'
                : 'bg-accent border-accent-foreground/10'
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${isRiskState ? 'bg-danger animate-pulse' : 'bg-success'}`} />
            <div>
              <p className={`text-sm font-semibold ${isRiskState ? 'text-danger' : 'text-success'}`}>
                {isRiskState ? 'Elevated Risk Detected — Immediate Attention Required' : 'All Systems Normal — Patient Stable'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Last updated: {new Date().toLocaleTimeString()} · AI Confidence: {isRiskState ? '94%' : '98%'}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <IntelligenceGauge score={appState.score} status={appState.status} color={appState.themeColor} />
            <InsightCard
              insight={appState.insight}
              onNotifyCaregiver={() => setCaregiverNotified(true)}
              onAlertHospital={() => setHospitalAlerted(true)}
              caregiverNotified={caregiverNotified}
              hospitalAlerted={hospitalAlerted}
              isRisk={isRiskState}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <VitalsCard vitals={appState.vitals} status={appState.status} color={appState.themeColor} />
            <TrendGraph data={chartData} color={appState.themeColor} isRisk={isRiskState} />
          </div>
        </div>

        {/* Bottom stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Shield, label: 'Risk Events Prevented', value: '12', sub: 'This quarter' },
            { icon: Clock, label: 'Avg. Early Detection', value: '48h', sub: 'Before clinical decline' },
            { icon: Users, label: 'Active Caregivers', value: '3', sub: 'Connected to patient' },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="bg-card p-5 rounded-2xl border border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Icon size={22} className="text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-card-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label} · {sub}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
};

export default Index;
