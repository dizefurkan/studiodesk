export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0'
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%'
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
  }).format(value / 100)
}

export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName.charAt(0).toUpperCase()
  const last = lastName?.charAt(0).toUpperCase() || ''
  return (first + last).slice(0, 2)
}

export function getFullName(firstName: string, lastName?: string): string {
  return `${firstName} ${lastName || ''}`.trim()
}
