import type { ContentBlock } from '@/content/blog/types'

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
                {b.text}
              </p>
            )
          case 'ul':
            return (
              <ul key={i} className="mt-4 list-disc space-y-2 pl-5 leading-[1.7] text-foreground/85 marker:text-primary">
                {b.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="mt-4 list-decimal space-y-2 pl-5 leading-[1.7] text-foreground/85 marker:text-muted-foreground">
                {b.items.map((item) => (
                  <li key={item}>{item}</li>
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
                            {cell}
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
                {b.text}
              </p>
            )
        }
      })}
    </>
  )
}
