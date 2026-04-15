'use client'

interface MetricCardsProps {
  available: number
  reserved: number
  overdue: number
  doNotUse: number
}

export function MetricCards({
  available,
  reserved,
  overdue,
  doNotUse,
}: MetricCardsProps) {
  const cards = [
    {
      label: 'Available',
      value: available,
      color: 'bg-green-50 border-green-200 text-green-700',
    },
    {
      label: 'Reserved',
      value: reserved,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    {
      label: 'Overdue (>90 days)',
      value: overdue,
      color: 'bg-red-50 border-red-200 text-red-700',
    },
    {
      label: 'Do Not Use',
      value: doNotUse,
      color: 'bg-gray-100 border-gray-300 text-gray-700',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`border rounded-lg p-4 ${card.color}`}
        >
          <p className="text-sm font-medium opacity-80">{card.label}</p>
          <p className="text-3xl font-bold mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
