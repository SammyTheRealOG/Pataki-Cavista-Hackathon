import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';

interface TrendGraphProps {
  data: Array<{ name: string; score: number }>;
  color: string;
  isRisk: boolean;
}

const TrendGraph = ({ data, color, isRisk }: TrendGraphProps) => (
  <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
    <div className="flex justify-between items-center mb-4">
      <div>
        <h3 className="text-lg font-bold text-card-foreground">7-Day Stability Trend</h3>
        <p className="text-sm text-muted-foreground">Behavioral pattern analysis</p>
      </div>
      {isRisk && (
        <span className="text-xs font-semibold bg-danger/10 text-danger px-3 py-1 rounded-full animate-pulse">
          ⚠ Anomaly Detected
        </span>
      )}
    </div>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214 20% 90%)" />
          <XAxis dataKey="name" tick={{ fill: 'hsl(215 14% 50%)', fontSize: 12 }} dy={10} />
          <YAxis tick={{ fill: 'hsl(215 14% 50%)', fontSize: 12 }} domain={[0, 100]} />
          {isRisk && <ReferenceLine y={50} stroke="hsl(0 84% 60%)" strokeDasharray="6 4" label={{ value: "Risk Threshold", fill: "hsl(0 84% 60%)", fontSize: 11 }} />}
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid hsl(214 20% 90%)',
              backgroundColor: 'hsl(0 0% 100%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: 13,
            }}
          />
          <Area type="monotone" dataKey="score" stroke={color} strokeWidth={3} fillOpacity={1} fill="url(#trendGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default TrendGraph;
