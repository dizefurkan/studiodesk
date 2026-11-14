import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { formatDay, parseDateOnly } from '@/lib/i18n/dates'
import { getPosts } from '@/content/blog'

export async function generateMetadata() {
  const t = await getTranslations('site.blog')
  return { title: t('title'), description: t('lead') }
}

export default async function BlogIndexPage() {
  const t = await getTranslations('site.blog')
  const locale = await getLocale()
  const posts = getPosts(locale)
  const [first, ...rest] = posts

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">{t('title')}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">{t('lead')}</p>

      {first && (
        <Link href={`/blog/${first.slug}`} className="group mt-12 block border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            {first.category}, {formatDay(locale, parseDateOnly(first.date), 'medium')}, {t('minutes', { count: first.readingMinutes })}
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-4xl">
            {first.title}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{first.description}</p>
        </Link>
      )}

      <ul className="mt-12 grid gap-x-10 sm:grid-cols-2">
        {rest.map((post) => (
          <li key={post.slug} className="border-t border-border">
            <Link href={`/blog/${post.slug}`} className="group block py-6">
              <p className="text-sm text-muted-foreground">
                {post.category}, {formatDay(locale, parseDateOnly(post.date), 'medium')}
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
