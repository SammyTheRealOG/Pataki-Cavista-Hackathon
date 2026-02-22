import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import AppShell from '@/components/layout/AppShell';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import IntelligenceGauge from '@/components/dashboard/IntelligenceGauge';
import VitalsCard from '@/components/dashboard/VitalsCard';
import InsightCard from '@/components/dashboard/InsightCard';
import TrendGraph from '@/components/dashboard/TrendGraph';
import LoadingOverlay from '@/components/dashboard/LoadingOverlay';
import { Shield, Clock, Users } from 'lucide-react';
import { mockInsights, mockRiskInsights } from '@/lib/mockInsights';

interface AppState {
  status: string;
  score: number;
  vitals: { hr: number; sleep: number; steps: number; fatigue: string };
  insight: string;
  themeColor: string;
}

// Key for sessionStorage
const SESSION_STORAGE_KEY = 'dashboard_state';

// Helper function to load state from sessionStorage
const loadStateFromSessionStorage = () => {
  try {
    const serializedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error("Error loading state from session storage:", error);
    return undefined;
  }
};

// Helper function to save state to sessionStorage
const saveStateToSessionStorage = (state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    sessionStorage.setItem(SESSION_STORAGE_KEY, serializedState);
  } catch (error) {
    console.error("Error saving state to session storage:", error);
  }
};

const Index = () => {
  // Initialize state from session storage or null/empty defaults
  const persistedState = loadStateFromSessionStorage();

  const [appState, setAppState] = useState<AppState | null>(persistedState?.appState || null);
  const [chartData, setChartData] = useState<Array<{ name: string; score: number }>>(persistedState?.chartData || []);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(persistedState?.isSynced || false);
  const [caregiverNotified, setCaregiverNotified] = useState(false);
  const [hospitalAlerted, setHospitalAlerted] = useState(false);
  const [patientName, setPatientName] = useState(persistedState?.patientName || '');
  const [stats, setStats] = useState(persistedState?.stats || { risk_events_prevented: 0, avg_early_detection: '–', active_caregivers: 0 });
  const [lastUpdatedTime, setLastUpdatedTime] = useState(persistedState?.lastUpdatedTime || '');

  // Load initial data from backend on mount OR from session storage
  useEffect(() => {
    const load = async () => {
      // If state was restored from session storage, no need to fetch again
      if (persistedState && persistedState.appState) { // Check if appState specifically was persisted
        // Ensure lastUpdatedTime is set if it was persisted, otherwise set default
        if (!persistedState.lastUpdatedTime) {
            setLastUpdatedTime("February 21, 2026, 8:00 PM");
        }
        return;
      }

      try {
        const [vitalsRes, trendRes, patientRes, statsRes] = await Promise.all([
          fetch('/api/vitals'),
          fetch('/api/trend'),
          fetch('/api/patient'),
          fetch('/api/stats'),
        ]);
        const vitals = await vitalsRes.json();
        const trend = await trendRes.json();
        const patient = await patientRes.json();
        const statsData = await statsRes.json();

        setAppState({
          status: vitals.status,
          score: vitals.stability_score,
          vitals: { hr: vitals.hr, sleep: vitals.sleep_hours, steps: vitals.steps, fatigue: vitals.fatigue },
          insight: vitals.insight,
          themeColor: vitals.theme_color,
        });
        setChartData(trend);
        setPatientName(patient.name);
        setStats(statsData);
        // Set initial last updated time
        setLastUpdatedTime("February 21, 2026, 8:00 PM"); // As requested by the user
      } catch (err) {
        console.error('Failed to load dashboard data, using mock data:', err);
        // Fallback to mock data
        setAppState({
          status: mockInsights.vitalsCard.status,
          score: mockInsights.intelligenceGauge.score,
          vitals: mockInsights.vitalsCard.vitals,
          insight: mockInsights.insightCard.insight,
          themeColor: mockInsights.vitalsCard.color,
        });
        setChartData(mockInsights.trendGraph.data);
        setPatientName('Mock Patient'); // Use a mock name as patient data also failed
        setStats({ risk_events_prevented: 0, avg_early_detection: 'N/A', active_caregivers: 0 }); // Mock stats
        setLastUpdatedTime("February 21, 2026, 8:00 PM"); // Even for mock, set the initial time
      }
    };
    load();
  }, [persistedState]); // Rerun if persistedState changes, though it usually won't once set.

  // Save state to session storage whenever relevant state variables change
  useEffect(() => {
    saveStateToSessionStorage({ appState, chartData, patientName, stats, lastUpdatedTime, isSynced });
  }, [appState, chartData, patientName, stats, lastUpdatedTime, isSynced]);

  const handleSync = async () => {
    setIsSyncing(true);
    setCaregiverNotified(false);
    setHospitalAlerted(false);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      setAppState({
        status: data.status,
        score: data.stability_score,
        vitals: { hr: data.hr, sleep: data.sleep_hours, steps: data.steps, fatigue: data.fatigue },
        insight: data.insight,
        themeColor: data.theme_color,
      });
      setChartData(data.trend);
      setIsSynced(true);
      setLastUpdatedTime(new Date().toLocaleString()); // Update with current time on successful sync
    } catch (err) {
      console.error('Sync failed, using mock risk data:', err);
      // Fallback to mock risk data
      setAppState({
        status: mockRiskInsights.vitalsCard.status,
        score: mockRiskInsights.intelligenceGauge.score,
        vitals: mockRiskInsights.vitalsCard.vitals,
        insight: mockRiskInsights.insightCard.insight,
        themeColor: mockRiskInsights.vitalsCard.color,
      });
      setChartData(mockRiskInsights.trendGraph.data);
      setIsSynced(true); // Treat as synced for UI purposes even if using mock
      setLastUpdatedTime(new Date().toLocaleString()); // Update time even if using mock
    } finally {
      setIsSyncing(false);
    }
  };

  if (!appState) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground text-sm animate-pulse">Loading patient data…</p>
        </div>
      </AppShell>
    );
  }

  const isRiskState = appState.status === 'High Risk';

  return (
    <AppShell>
      <DashboardHeader
        patientName={patientName}
        onSync={handleSync}
        isSynced={isSynced}
        isLoading={isSyncing}
      />

      <AnimatePresence>{isSyncing && <LoadingOverlay />}</AnimatePresence>

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
                Last updated: {lastUpdatedTime} · AI Confidence: {isRiskState ? '94%' : '98%'}
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
            { icon: Shield, label: 'Risk Events Prevented', value: String(stats.risk_events_prevented), sub: 'This quarter' },
            { icon: Clock, label: 'Avg. Early Detection', value: stats.avg_early_detection, sub: 'Before clinical decline' },
            { icon: Users, label: 'Active Caregivers', value: String(stats.active_caregivers), sub: 'Connected to patient' },
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