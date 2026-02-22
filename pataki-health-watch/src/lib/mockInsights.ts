// pataki-health-watch/src/lib/mockInsights.ts

export const mockInsights = {
  insightCard: {
    insight: "Mock AI Insight: The user's vital signs indicate a stable trend over the past week, with no significant anomalies detected. Continue to monitor for consistent patterns. Consider encouraging light daily activity to maintain current health metrics.",
    isRisk: false,
  },
  intelligenceGauge: {
    score: 85,
    status: "Stable",
    color: "hsl(142.1 76.2% 36.3%)", // green color for stable
  },
  trendGraph: {
    data: [
      { name: "Mon", score: 70 },
      { name: "Tue", score: 75 },
      { name: "Wed", score: 80 },
      { name: "Thu", score: 85 },
      { name: "Fri", score: 82 },
      { name: "Sat", score: 88 },
      { name: "Sun", score: 90 },
    ],
    isRisk: false,
  },
  vitalsCard: {
    vitals: {
      hr: 72,
      sleep: 7.5,
      steps: 8500,
      fatigue: "Low",
    },
    status: "Normal",
    color: "hsl(142.1 76.2% 36.3%)", // green color for normal
  },
};

export const mockRiskInsights = {
  insightCard: {
    insight: "Mock AI Insight: An unusual fluctuation in heart rate and a decrease in sleep duration have been observed over the last 24 hours. There is a potential elevated risk for fatigue. Consider checking the user's recent activity and provide a quiet environment for rest. Alert caregiver if symptoms persist.",
    isRisk: true,
  },
  intelligenceGauge: {
    score: 45,
    status: "At Risk",
    color: "hsl(48 96% 89%)", // yellow/orange color for at risk
  },
  trendGraph: {
    data: [
      { name: "Mon", score: 80 },
      { name: "Tue", score: 78 },
      { name: "Wed", score: 65 },
      { name: "Thu", score: 50 },
      { name: "Fri", score: 45 },
      { name: "Sat", score: 55 },
      { name: "Sun", score: 48 },
    ],
    isRisk: true,
  },
  vitalsCard: {
    vitals: {
      hr: 95,
      sleep: 5.0,
      steps: 3200,
      fatigue: "High",
    },
    status: "Elevated Risk",
    color: "hsl(346.8 77.2% 49.8%)", // red color for high risk
  },
};
