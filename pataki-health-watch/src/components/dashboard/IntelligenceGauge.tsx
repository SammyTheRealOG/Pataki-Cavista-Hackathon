import { motion } from 'motion/react';

interface IntelligenceGaugeProps {
  score: number;
  status: string;
  color: string;
}

const IntelligenceGauge = ({ score, status, color }: IntelligenceGaugeProps) => {
  const circumference = 2 * Math.PI * 55;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col items-center">
      <h3 className="text-lg font-bold text-card-foreground">Vitals Summary</h3>
      <p className="text-sm text-muted-foreground mb-4">Stability Score</p>
      <div className="relative flex items-center justify-center w-48 h-48">
        <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="55" stroke="hsl(var(--muted))" strokeWidth="10" fill="transparent" />
          <motion.circle
            cx="60" cy="60" r="55"
            stroke={color} strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "circOut" }}
          />
        </svg>
        <div className="text-center">
          <motion.h2
            className="text-5xl font-extrabold"
            style={{ color }}
            key={score}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {Math.round(score)}
          </motion.h2>
          <p className="font-semibold text-sm mt-1" style={{ color }}>{status}</p>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceGauge;
