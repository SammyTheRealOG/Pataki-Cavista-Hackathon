import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface DashboardHeaderProps {
  patientName: string;
  onSync: () => void;
  isSynced: boolean;
  isLoading: boolean;
}

const DashboardHeader = ({ patientName, onSync, isSynced, isLoading }: DashboardHeaderProps) => (
  <div className="bg-secondary/30 border-b border-border">
    <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
      <p className="text-sm text-muted-foreground">
        Monitoring <span className="font-semibold text-primary">{patientName}</span>
      </p>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${isSynced ? 'bg-success/10 text-success border-success/20' : 'bg-secondary text-muted-foreground border-border'}`}>
          {isSynced ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{isSynced ? 'Synced' : 'Awaiting Sync'}</span>
        </div>
        <button
          onClick={onSync}
          disabled={isLoading}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm py-2 px-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Sync Data
        </button>
      </div>
    </div>
  </div>
);

export default DashboardHeader;
