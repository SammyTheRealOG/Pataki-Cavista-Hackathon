import { motion } from 'motion/react';
import { User, MapPin, Watch, Phone, Clock } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-card-foreground">{value}</span>
  </div>
);

const Account = () => (
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
          <InfoRow label="Full Name" value="Esther Wanjiku" />
          <InfoRow label="Age" value="78 years" />
          <InfoRow label="Address" value="14 Riverside Dr, Nairobi, Kenya" />
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
          <InfoRow label="Device" value="Fitbit Sense 2" />
          <InfoRow label="Status" value="Connected" />
          <InfoRow label="Last Synced" value={new Date().toLocaleDateString() + ' · ' + new Date().toLocaleTimeString()} />
          <InfoRow label="Battery" value="72%" />
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
          <InfoRow label="Name" value="Amina Odhiambo" />
          <InfoRow label="Relationship" value="Daughter" />
          <InfoRow label="Phone" value="+254 712 345 678" />
          <InfoRow label="Email" value="amina.o@email.com" />
        </motion.div>
      </div>
    </main>
  </AppShell>
);

export default Account;
