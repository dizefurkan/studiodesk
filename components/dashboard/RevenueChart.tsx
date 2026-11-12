'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslations } from 'next-intl'

interface RevenueChartProps {
  data: Array<{
    name: string
    revenue: number
  }>
  currency: string
}

export function RevenueChart({ data, currency }: RevenueChartProps) {
  const t = useTranslations()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="text-lg sm:text-xl">{t('dashboard.revenueOverMonth')}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('dashboard.monthlyGrowth')} - Last 12 Months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
