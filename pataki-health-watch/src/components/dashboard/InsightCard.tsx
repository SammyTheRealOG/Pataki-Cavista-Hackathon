import { useState } from 'react';
import { BellDot, Siren, CheckCircle2, Phone, X, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InsightCardProps {
  insight: string;
  onNotifyCaregiver: () => void;
  onAlertHospital: () => void;
  caregiverNotified: boolean;
  hospitalAlerted: boolean;
  isRisk: boolean;
}

interface Hospital {
  name: string;
  address: string;
  distance: number;
  phone?: string;
}

const mockHospital: Hospital = {
  name: 'Mock General Hospital',
  address: '123 Mockingbird Lane, Mockville',
  distance: 5.2,
  phone: '555-123-4567',
};

const InsightCard = ({
  insight,
  onNotifyCaregiver,
  onAlertHospital,
  caregiverNotified,
  hospitalAlerted,
  isRisk,
}: InsightCardProps) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const handleEmergencyClick = async () => {
    // Notify parent (flips button to "notified" state in Index.tsx)
    onAlertHospital();
    setShowOverlay(true);
    setIsLocating(true);
    setLocError('');
    setHospital(null);

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Use mock data
    setHospital(mockHospital);
    console.log(`[Emergency] Mock hospital set: "${mockHospital.name}"`);

    setIsLocating(false);
  };


  return (
    <>
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
                <button
                  onClick={() => setShowOverlay(true)}
                  className="w-full flex items-center gap-2 p-3 bg-danger/10 text-danger rounded-xl text-sm font-semibold justify-center border border-danger/20 hover:bg-danger/15 transition-all"
                >
                  <CheckCircle2 size={18} />
                  Emergency Services Notified — View Hospital
                </button>
              ) : (
                <button
                  onClick={handleEmergencyClick}
                  className="w-full flex items-center justify-center gap-2 bg-danger text-danger-foreground font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-all"
                >
                  <Siren size={20} />
                  Emergency — Alert Nearest Hospital
                </button>
              )}

              <p className="text-xs text-muted-foreground text-center mt-1">
                <Phone size={12} className="inline mr-1" />
                Emergency line: If unresponsive, call 112 immediately
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Hospital Overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 16, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-card rounded-2xl border border-danger/30 shadow-2xl p-6 w-full max-w-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-danger flex items-center gap-2">
                  <Siren size={18} />
                  Nearest Hospital Located
                </h3>
                <button
                  onClick={() => setShowOverlay(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Loading */}
              {isLocating && (
                <div className="flex items-center gap-3 text-muted-foreground py-6 justify-center">
                  <Loader2 size={20} className="animate-spin text-danger" />
                  <p className="text-sm">Locating nearest hospital…</p>
                </div>
              )}

              {/* Error */}
              {locError && !isLocating && (
                <div className="text-danger text-sm p-4 bg-danger/10 rounded-xl border border-danger/20">
                  {locError}
                </div>
              )}

              {/* Hospital info */}
              {hospital && !isLocating && (
                <div className="space-y-4">
                  <div className="p-4 bg-danger/5 rounded-xl border border-danger/20">
                    <p className="font-bold text-card-foreground text-base">{hospital.name}</p>
                    <p className="text-sm text-muted-foreground mt-1.5 flex items-start gap-1.5">
                      <MapPin size={13} className="mt-0.5 shrink-0 text-danger" />
                      {hospital.address}
                    </p>
                    <p className="text-sm font-semibold text-danger mt-2">
                      {hospital.distance.toFixed(1)} km away
                    </p>
                    {hospital.phone && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Phone size={13} />
                        {hospital.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-success/10 rounded-xl border border-success/20">
                    <CheckCircle2 size={16} className="text-success shrink-0" />
                    <p className="text-xs text-success font-semibold">
                      Emergency services have been notified of the patient's location.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InsightCard;
