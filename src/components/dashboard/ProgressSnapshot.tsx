'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface CategoryData {
  category: string
  avgScore: number
  practiceCount: number
}

interface ProgressSnapshotProps {
  data: CategoryData[]
}

const CATEGORY_LABELS: Record<string, string> = {
  PRODUCT_SENSE: 'Product Sense',
  EXECUTION: 'Execution',
  STRATEGY: 'Strategy',
  BEHAVIORAL: 'Behavioral',
  ESTIMATION: 'Estimation',
  METRICS: 'Metrics',
  PRODUCT_DESIGN: 'Product Design',
  TECHNICAL_AI: 'Technical AI',
  ML_SYSTEM_DESIGN: 'ML Design',
  AI_ETHICS: 'AI Ethics',
}

export function ProgressSnapshot({ data }: ProgressSnapshotProps) {
  const chartData = data.map((d) => ({
    name: CATEGORY_LABELS[d.category] || d.category,
    score: Math.round(d.avgScore),
    count: d.practiceCount,
  }))

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#e2e8f0' }}
            itemStyle={{ color: '#94a3b8' }}
            formatter={(value, name) => [`${value}%`, name === 'score' ? 'Avg Score' : name]}
          />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.score >= 70
                    ? '#10b981'
                    : entry.score >= 40
                    ? '#f59e0b'
                    : '#ef4444'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
