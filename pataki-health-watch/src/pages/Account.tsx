import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Watch, Phone } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';

interface Patient {
  name: string;
  age: number;
  address: string;
  device_name: string;
  device_status: string;
  device_battery: string;
  caregiver_name: string;
  caregiver_relationship: string;
  caregiver_phone: string;
  caregiver_email: string;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-card-foreground">{value}</span>
  </div>
);

const Account = () => {
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetch('/api/patient')
      .then((r) => r.json())
      .then(setPatient)
      .catch((err) => console.error('Failed to load patient:', err));
  }, []);

  if (!patient) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground text-sm animate-pulse">Loading account data…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-extrabold text-foreground mb-8">Account Overview</h2>

        <div className="space-y-6">
          {/* Patient Info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <User size={22} className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-card-foreground">Patient Profile</h3>
                <p className="text-xs text-muted-foreground">Person being monitored</p>
              </div>
            </div>
            <InfoRow label="Full Name" value={patient.name} />
            <InfoRow label="Age" value={`${patient.age} years`} />
            <InfoRow label="Address" value={patient.address} />
          </motion.div>

          {/* Wearable Device */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <Watch size={22} className="text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-card-foreground">Wearable Device</h3>
                <p className="text-xs text-muted-foreground">Data source integration</p>
              </div>
            </div>
            <InfoRow label="Device" value={patient.device_name} />
            <InfoRow label="Status" value={patient.device_status} />
            <InfoRow label="Last Synced" value={`${new Date().toLocaleDateString()} · ${new Date().toLocaleTimeString()}`} />
            <InfoRow label="Battery" value={patient.device_battery} />
          </motion.div>

          {/* Caretaker */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Phone size={22} className="text-success" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-card-foreground">Caretaker Details</h3>
                <p className="text-xs text-muted-foreground">Primary contact person</p>
              </div>
            </div>
            <InfoRow label="Name" value={patient.caregiver_name} />
            <InfoRow label="Relationship" value={patient.caregiver_relationship} />
            <InfoRow label="Phone" value={patient.caregiver_phone} />
            <InfoRow label="Email" value={patient.caregiver_email} />
          </motion.div>
        </div>
      </main>
    </AppShell>
  );
};

export default Account;
