import { BellDot, Siren, CheckCircle2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InsightCardProps {
  insight: string;
  onNotifyCaregiver: () => void;
  onAlertHospital: () => void;
  caregiverNotified: boolean;
  hospitalAlerted: boolean;
  isRisk: boolean;
}

const InsightCard = ({ insight, onNotifyCaregiver, onAlertHospital, caregiverNotified, hospitalAlerted, isRisk }: InsightCardProps) => (
  <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
    <h3 className="text-lg font-bold text-card-foreground mb-1">AI Insight</h3>
    <p className="text-sm text-muted-foreground mb-4">Note: All AI information should be fact checked</p>
    <motion.p
      key={insight}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-sm text-card-foreground leading-relaxed bg-secondary/60 p-4 rounded-xl border border-border"
    >
      {insight}
    </motion.p>
    <AnimatePresence>
      {isRisk && (
        <motion.div
          className="mt-4 flex flex-col gap-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {/* Alert Caregiver */}
          {caregiverNotified ? (
            <div className="flex items-center gap-2 p-3 bg-success/10 text-success rounded-xl text-sm font-semibold justify-center border border-success/20">
              <CheckCircle2 size={18} />
              Caregiver Alert Sent Successfully
            </div>
          ) : (
            <button
              onClick={onNotifyCaregiver}
              className="w-full flex items-center justify-center gap-2 bg-warning text-warning-foreground font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-all animate-pulse"
            >
              <BellDot size={20} />
              Alert Caregiver
            </button>
          )}

          {/* Emergency Hospital Alert */}
          {hospitalAlerted ? (
            <div className="flex items-center gap-2 p-3 bg-danger/10 text-danger rounded-xl text-sm font-semibold justify-center border border-danger/20">
              <CheckCircle2 size={18} />
              Emergency Services Notified
            </div>
          ) : (
            <button
              onClick={onAlertHospital}
              className="w-full flex items-center justify-center gap-2 bg-danger text-danger-foreground font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-all"
            >
              <Siren size={20} />
              Emergency — Alert Nearest Hospital
            </button>
          )}

          <p className="text-xs text-muted-foreground text-center mt-1">
            <Phone size={12} className="inline mr-1" />
            Emergency line: If unresponsive, call 911 immediately
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default InsightCard;
