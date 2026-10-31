import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PricePoint, SupplierSeries } from '../types'
import { formatMoney, formatShortDate } from '../utils/format'

const AXIS_STYLE = { fontSize: 11, fill: '#718078' }
const GRID_COLOR = '#E4EBE7'
const LINE_COLORS = ['#0F8B5F', '#3BA377', '#E9A23B', '#2C5C8F', '#8A6BBF', '#DC5555']

interface TooltipEntry {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
  suffix,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
  unit?: string
  suffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-raised">
      {label !== undefined && <p className="mb-1 font-semibold text-ink">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-ink-soft">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color ?? LINE_COLORS[index % LINE_COLORS.length] }}
          />
          <span className="max-w-[180px] truncate">{entry.name}</span>
          <span className="ml-auto font-semibold text-ink">
            {formatMoney(Number(entry.value))}
            {suffix ?? ` UZS${unit ? `/${unit}` : ''}`}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Market trend: average price per day across all tracked products. */
export function TrendAreaChart({ data, height = 220 }: { data: { date: string; avg_price: number }[]; height?: number }) {
  const points = data.map((point) => ({ ...point, label: formatShortDate(point.date) }))
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F8B5F" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#0F8B5F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={58}
            tickFormatter={(value: number) => formatMoney(value)}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="avg_price"
            name="Average price"
            stroke="#0F8B5F"
            strokeWidth={2}
            fill="url(#trendFill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Average price by category. */
export function CategoryBarChart({ data, height = 240 }: { data: { category: string; avg_price: number | null }[]; height?: number }) {
  const points = data.filter((item) => item.avg_price).map((item) => ({ ...item, name: item.category }))
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
          <XAxis
            type="number"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatMoney(value)}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={92}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F7F9F8' }} />
          <Bar dataKey="avg_price" name="Average price" radius={[0, 6, 6, 0]} barSize={16}>
            {points.map((_, index) => (
              <Cell key={index} fill={index % 2 === 0 ? '#0F8B5F' : '#3BA377'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Historical price lines, overall average plus one line per supplier. */
export function PriceHistoryChart({
  points,
  series,
  unit,
  showSuppliers = true,
  height = 300,
}: {
  points: PricePoint[]
  series: SupplierSeries[]
  unit: string
  showSuppliers?: boolean
  height?: number
}) {
  const dateLabels = new Map(points.map((point) => [point.date, formatShortDate(point.date)]))
  const rows = points.map((point) => {
    const row: Record<string, string | number> = { label: dateLabels.get(point.date) ?? point.date }
    row['Average'] = point.price
    if (showSuppliers) {
      series.forEach((supplier) => {
        const match = supplier.points.find((p) => p.date === point.date)
        if (match) row[supplier.supplier_name] = match.price
      })
    }
    return row
  })

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={62}
            domain={['auto', 'auto']}
            tickFormatter={(value: number) => formatMoney(value)}
          />
          <Tooltip content={<ChartTooltip unit={unit} />} />
          <Line
            type="monotone"
            dataKey="Average"
            stroke="#0F8B5F"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
          {showSuppliers &&
            series.map((supplier, index) => (
              <Line
                key={supplier.supplier_id}
                type="monotone"
                dataKey={supplier.supplier_name}
                stroke={LINE_COLORS[(index + 1) % LINE_COLORS.length]}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                connectNulls
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
