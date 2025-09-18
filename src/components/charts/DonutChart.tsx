import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface DonutChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  title?: string
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
        <p className="text-white font-medium">{payload[0].name}</p>
        <p className="text-cyan-300">
          <span className="font-semibold">{payload[0].value}</span>
          <span className="text-slate-300 ml-1">öğe</span>
        </p>
      </div>
    )
  }
  return null
}

export function DonutChart({ data, title }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="w-full h-full flex flex-col">
      {title && (
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: '12px',
                color: 'var(--text-color)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text showing total */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {total}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Toplam
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}