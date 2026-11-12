/** Title + description + optional primary action for dashboard pages. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  /** Omit while the page shows its <EmptyState/> CTA, so the create action isn't duplicated. */
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
