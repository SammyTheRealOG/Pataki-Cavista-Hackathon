import { Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface DashboardHeaderProps {
  patientName: string;
  onSync: () => void;
  isSynced: boolean;
  isLoading: boolean;
}

const DashboardHeader = ({ patientName, onSync, isSynced, isLoading }: DashboardHeaderProps) => (
  <header className="bg-card border-b border-border sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Activity size={22} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Pataki</h1>
          <p className="text-xs text-muted-foreground">
            Monitoring <span className="font-semibold text-primary">{patientName}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${isSynced ? 'bg-success/10 text-success border-success/20' : 'bg-secondary text-muted-foreground border-border'}`}>
          {isSynced ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{isSynced ? 'Synced' : 'Awaiting Sync'}</span>
        </div>
        <button
          onClick={onSync}
          disabled={isLoading}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm py-2.5 px-5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Sync Data
        </button>
      </div>
    </div>
  </header>
);

export default DashboardHeader;
