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

/** Haversine great-circle distance in kilometres. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser. Please call 112.');
      setIsLocating(false);
      return;
    }

    try {
      // 1. Get browser geolocation (free, no API key needed)
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 0,
          enableHighAccuracy: true,
        })
      );
      const { latitude: userLat, longitude: userLon } = position.coords;
      console.log(`[Emergency] User location acquired: ${userLat.toFixed(5)}, ${userLon.toFixed(5)}`);

      // 2. Query Overpass API (free OpenStreetMap data, no API key needed)
      //    Search for hospitals within 15 km of the user
      const query =
        `[out:json][timeout:15];` +
        `(node["amenity"="hospital"](around:15000,${userLat},${userLon});` +
        `way["amenity"="hospital"](around:15000,${userLat},${userLon}););` +
        `out center tags;`;

      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      });

      if (!res.ok) {
        throw new Error(`Overpass API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log(`[Emergency] Overpass API returned ${data.elements?.length ?? 0} hospital(s)`);

      if (!data.elements || data.elements.length === 0) {
        setLocError('No hospitals found within 15 km. Please call 112 immediately.');
        return;
      }

      // 3. Find the nearest hospital by Haversine distance
      let nearest: Hospital | null = null;
      let minDist = Infinity;

      for (const el of data.elements) {
        // Nodes have lat/lon directly; ways have a center object
        const elLat: number = el.lat ?? el.center?.lat;
        const elLon: number = el.lon ?? el.center?.lon;
        if (elLat == null || elLon == null) continue;

        const dist = haversineKm(userLat, userLon, elLat, elLon);
        if (dist < minDist) {
          minDist = dist;
          const tags = el.tags ?? {};
          const addrParts = [
            tags['addr:housenumber'],
            tags['addr:street'],
            tags['addr:city'],
          ].filter(Boolean);

          nearest = {
            name: tags.name || 'Nearest Hospital',
            address:
              addrParts.length > 0
                ? addrParts.join(', ')
                : 'Address not available in map data',
            distance: dist,
            phone: tags.phone ?? tags['contact:phone'],
          };
        }
      }

      if (nearest) {
        setHospital(nearest);
        console.log(`[Emergency] Nearest hospital: "${nearest.name}" — ${nearest.distance.toFixed(1)} km`);
      } else {
        setLocError('Could not determine hospital coordinates. Please call 112.');
      }
    } catch (err: unknown) {
      console.error('[Emergency] Failed to locate nearest hospital:', err);
      if (err instanceof GeolocationPositionError) {
        const msgs: Record<number, string> = {
          1: 'Location access denied. Enable location services and try again, or call 112.',
          2: 'Your location is currently unavailable. Please call 112 immediately.',
          3: 'Location request timed out. Please call 112 immediately.',
        };
        setLocError(msgs[err.code] ?? 'Location error. Please call 112.');
      } else {
        setLocError('Failed to find nearest hospital. Please call 112 immediately.');
      }
    } finally {
      setIsLocating(false);
    }
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
