/** Endless strip of dance styles. CSS animation; stops for reduced motion, pauses on hover. */
export function Marquee({ items, label }: { items: string[]; label: string }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-10 pr-10">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-10 whitespace-nowrap font-display text-2xl font-medium text-foreground/45 sm:text-3xl">
          {item}
          <span aria-hidden className="size-1.5 rounded-full bg-highlight" />
        </li>
      ))}
    </ul>
  )
  return (
    <div
      aria-label={label}
      className="group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
    >
      <div className="flex animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}
