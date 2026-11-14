import { Check, Minus } from 'lucide-react'

/** "How it's done today" next to "with StudioDesk", row by row. */
export function Compare({
  beforeTitle,
  afterTitle,
  rows,
}: {
  beforeTitle: string
  afterTitle: string
  rows: Array<{ job: string; before: string; after: string }>
}) {
  return (
    <div className="overflow-hidden rounded-3xl bg-background">
      <div className="hidden grid-cols-[1fr_1.2fr_1.2fr] bg-surface text-sm font-medium md:grid">
        <div className="px-6 py-4" />
        <div className="px-6 py-4 text-muted-foreground">{beforeTitle}</div>
        <div className="bg-highlight px-6 py-4 text-highlight-foreground">{afterTitle}</div>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.job} className="grid md:grid-cols-[1fr_1.2fr_1.2fr]">
            <div className="px-6 pt-5 font-display text-lg font-semibold text-foreground md:py-5">{r.job}</div>
            <div className="flex gap-2.5 px-6 py-3 text-sm text-muted-foreground md:py-5">
              <Minus className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                <span className="sr-only md:hidden">{beforeTitle}: </span>
                {r.before}
              </span>
            </div>
            <div className="flex gap-2.5 bg-highlight/25 px-6 py-4 text-sm text-foreground md:py-5">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="sr-only md:hidden">{afterTitle}: </span>
                {r.after}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
