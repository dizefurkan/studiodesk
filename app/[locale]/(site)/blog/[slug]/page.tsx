import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { SUPPORTED_LOCALES } from '@/lib/i18n/config'
import { formatDay, parseDateOnly } from '@/lib/i18n/dates'
import { Button } from '@/components/ui/button'
import { allPostSlugs, getPost, getPosts } from '@/content/blog'
import { ContentBlocks } from '@/components/site/ContentBlocks'

export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) => allPostSlugs().map((slug) => ({ locale, slug })))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params
  const post = getPost(locale, slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    openGraph: { title: post.title, description: post.description, type: 'article', publishedTime: post.date },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale()
  const t = await getTranslations('site.blog')
  const post = getPost(locale, slug)
  if (!post) notFound()
  const more = getPosts(locale).filter((p) => p.slug !== slug).slice(0, 2)

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-20">
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t('back')}
      </Link>
      <p className="mt-8 text-sm text-muted-foreground">
        {post.category}, {formatDay(locale, parseDateOnly(post.date), 'medium')}, {t('minutes', { count: post.readingMinutes })}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
        {post.title}
      </h1>
      <p className="mt-5 text-xl leading-relaxed text-muted-foreground">{post.description}</p>
      <div className="mt-6 max-w-[68ch]">
        <ContentBlocks blocks={post.body} />
      </div>

      <aside className="mt-16 rounded-3xl bg-foreground p-8 text-background">
        <p className="font-display text-2xl font-semibold">{t('ctaTitle')}</p>
        <p className="mt-2 text-background/70">{t('ctaText')}</p>
        <Button asChild className="mt-5">
          <Link href="/#demo">{t('ctaButton')}</Link>
        </Button>
      </aside>

      {more.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-xl font-semibold text-foreground">{t('more')}</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {more.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="block py-4 font-medium text-foreground hover:text-primary">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
