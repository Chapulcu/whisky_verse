import React from 'react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface LineChartProps {
  data: Array<{
    day: string
    items_added: number
  }>
  showAverage?: boolean
  gradient?: boolean
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
        <p className="text-white font-medium mb-1">{new Date(label).toLocaleDateString('tr-TR')}</p>
        <p className="text-cyan-300">
          <span className="font-semibold">{payload[0].value}</span>
          <span className="text-slate-300 ml-1">öğe eklendi</span>
        </p>
      </div>
    )
  }
  return null
}

export function LineChart({ data, showAverage = true, gradient = true }: LineChartProps) {
  const average = data.length > 0 ? data.reduce((sum, item) => sum + item.items_added, 0) / data.length : 0

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            {gradient && (
              <>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </>
            )}
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.1)"
            vertical={false}
          />

          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'rgba(148, 163, 184, 0.8)' }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('tr-TR', {
              month: 'short',
              day: 'numeric'
            })}
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

          <Line
            type="monotone"
            dataKey="items_added"
            stroke={gradient ? "url(#lineGradient)" : "#06b6d4"}
            strokeWidth={3}
            dot={{
              fill: gradient ? "#06b6d4" : "#06b6d4",
              strokeWidth: 2,
              stroke: "#ffffff",
              r: 4
            }}
            activeDot={{
              r: 6,
              stroke: "#ffffff",
              strokeWidth: 2,
              fill: "#06b6d4"
            }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}