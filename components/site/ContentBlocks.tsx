import { Fragment } from 'react'
import { Link } from '@/i18n/navigation'
import type { ContentBlock } from '@/content/blog/types'

const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g

/** Inline `[label](/path)` links (internal paths go through the locale-aware Link) and `**bold**`. */
function Inline({ text }: { text: string }) {
  const out: React.ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    const i = m.index ?? 0
    if (i > last) out.push(text.slice(last, i))
    if (m[1]) {
      const cls = 'font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary'
      out.push(
        m[2].startsWith('/') ? (
          <Link key={i} href={m[2]} className={cls}>
            {m[1]}
          </Link>
        ) : (
          <a key={i} href={m[2]} className={cls} rel="noopener" target="_blank">
            {m[1]}
          </a>
        )
      )
    } else {
      out.push(
        <strong key={i} className="font-semibold text-foreground">
          {m[3]}
        </strong>
      )
    }
    last = i + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return <Fragment>{out}</Fragment>
}

/** Renders the structured blocks used by legal pages and blog posts. */
export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h2':
            return (
              <h2 key={i} className="mt-10 font-display text-2xl font-semibold tracking-tight text-foreground">
                {b.text}
              </h2>
            )
          case 'p':
            return (
              <p key={i} className="mt-4 leading-[1.75] text-foreground/85">
                <Inline text={b.text} />
              </p>
            )
          case 'ul':
            return (
              <ul key={i} className="mt-4 list-disc space-y-2 pl-5 leading-[1.7] text-foreground/85 marker:text-primary">
                {b.items.map((item) => (
                  <li key={item}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="mt-4 list-decimal space-y-2 pl-5 leading-[1.7] text-foreground/85 marker:text-muted-foreground">
                {b.items.map((item) => (
                  <li key={item}>
                    <Inline text={item} />
                  </li>
                ))}
              </ol>
            )
          case 'table':
            return (
              <div key={i} className="mt-5 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-muted/70">
                    <tr>
                      {b.head.map((h) => (
                        <th key={h} scope="col" className="px-4 py-3 font-medium text-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {b.rows.map((row, r) => (
                      <tr key={r} className="align-top">
                        {row.map((cell, c) => (
                          <td key={c} className={c === 0 ? 'px-4 py-3 font-medium text-foreground' : 'px-4 py-3 text-foreground/80'}>
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'tip':
            return (
              <p key={i} className="mt-6 rounded-xl border-l-4 border-highlight bg-highlight/15 px-4 py-3 leading-relaxed text-foreground">
                <Inline text={b.text} />
              </p>
            )
        }
      })}
    </>
  )
}
