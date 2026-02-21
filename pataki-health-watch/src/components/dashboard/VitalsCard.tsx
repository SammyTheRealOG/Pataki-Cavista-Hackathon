import { HeartPulse, BedDouble, Footprints, BatteryWarning } from 'lucide-react';
import { motion } from 'motion/react';

interface Vitals {
  hr: number;
  sleep: number;
  steps: number;
  fatigue: string;
}

interface VitalsCardProps {
  vitals: Vitals;
  status: string;
  color: string;
}

const Vital = ({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string | number; unit?: string }) => (
  <motion.div
    className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {icon}
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold text-lg text-card-foreground">{value} {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}</p>
    </div>
  </motion.div>
);

const VitalsCard = ({ vitals, status, color }: VitalsCardProps) => {
  const isRisk = status === 'High Risk';

  return (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-lg font-bold text-card-foreground">Vitals Overview</h3>
        <span
          className="px-3 py-1 text-xs font-semibold rounded-full"
          style={{ backgroundColor: color, color: '#fff' }}
        >
          {status}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Today's Average Data</p>
      <div className="grid grid-cols-2 gap-3">
        <Vital icon={<HeartPulse size={28} className="text-danger shrink-0" />} label="Heart Rate" value={vitals.hr} unit="bpm" />
        <Vital icon={<BedDouble size={28} className="text-primary shrink-0" />} label="Sleep" value={vitals.sleep} unit="h" />
        <Vital icon={<Footprints size={28} className="text-success shrink-0" />} label="Steps" value={vitals.steps.toLocaleString()} />
        <Vital icon={<BatteryWarning size={28} className={`shrink-0 ${isRisk ? 'text-warning' : 'text-muted-foreground'}`} />} label="Fatigue" value={vitals.fatigue} />
      </div>
    </div>
  );
};

export default VitalsCard;
