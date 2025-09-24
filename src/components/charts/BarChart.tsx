import React from 'react'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface BarChartProps {
  data: Array<{
    name: string
    value: number
  }>
  showAverage?: boolean
  gradient?: boolean
  color?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-2xl">
        <p className="text-white font-medium mb-1">{label}</p>
        <p className="text-cyan-300">
          <span className="font-semibold">{payload[0].value}</span>
          <span className="text-slate-300 ml-1">öğe</span>
        </p>
      </div>
    )
  }
  return null
}

export function BarChart({
  data,
  showAverage = true,
  gradient = true,
  color = "#06b6d4"
}: BarChartProps) {
  const average = data.length > 0 ? data.reduce((sum, item) => sum + item.value, 0) / data.length : 0

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <defs>
            {gradient && (
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                <stop offset="100%" stopColor={color} stopOpacity={0.3} />
              </linearGradient>
            )}
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.1)"
            vertical={false}
          />

          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'rgba(148, 163, 184, 0.8)' }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'rgba(148, 163, 184, 0.8)' }}
          />

          <Tooltip content={<CustomTooltip />} />

          {showAverage && (
            <ReferenceLine
              y={average}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeOpacity={0.7}
              label={{
                value: `Ortalama: ${average.toFixed(1)}`,
                position: 'top' as const,
                style: {
                  fontSize: '12px',
                  fill: '#f59e0b',
                  fontWeight: 'bold'
                }
              }}
            />
          )}

          <Bar
            dataKey="value"
            fill={gradient ? "url(#barGradient)" : color}
            radius={[4, 4, 0, 0]}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={1}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}