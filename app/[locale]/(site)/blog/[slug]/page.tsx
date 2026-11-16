import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { Link, redirect } from '@/i18n/navigation'
import { formatDay, parseDateOnly } from '@/lib/i18n/dates'
import { absoluteUrl, alternates, OG_LOCALE, SITE_URL } from '@/lib/seo'
import type { Locale } from '@/lib/i18n/config'
import { Button } from '@/components/ui/button'
import { findAnyLocale, getPost, localeParams, relatedPosts, translations } from '@/content/blog'
import { ContentBlocks } from '@/components/site/ContentBlocks'
import { JsonLd } from '@/components/seo/JsonLd'

export function generateStaticParams() {
  return localeParams()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params
  const post = getPost(locale, slug)
  if (!post) return {}
  const paths = Object.fromEntries(Object.entries(translations(post.key)).map(([l, s]) => [l, `/blog/${s}`]))
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: alternates(locale, paths),
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      siteName: 'StudioDesk',
      url: absoluteUrl(locale, `/blog/${slug}`),
      locale: OG_LOCALE[locale as Locale],
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      section: post.category,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.description },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale()
  const t = await getTranslations('site.blog')
  const post = getPost(locale, slug)
  if (!post) {
    // A slug from the other language (e.g. after switching language): go to this language's version.
    const other = findAnyLocale(slug)
    const target = other && translations(other.key)[locale as Locale]
    if (target) redirect({ href: `/blog/${target}`, locale })
    notFound()
  }
  const more = relatedPosts(locale, post, 3)
  const url = absoluteUrl(locale, `/blog/${post.slug}`)

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-20">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.description,
            inLanguage: locale,
            datePublished: post.date,
            dateModified: post.updated ?? post.date,
            mainEntityOfPage: url,
            url,
            articleSection: post.category,
            keywords: post.keywords?.join(', '),
            author: { '@type': 'Organization', name: 'StudioDesk', url: SITE_URL },
            publisher: {
              '@type': 'Organization',
              name: 'StudioDesk',
              logo: { '@type': 'ImageObject', url: `${SITE_URL}/brand/icon-512.png` },
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'StudioDesk', item: absoluteUrl(locale) },
              { '@type': 'ListItem', position: 2, name: t('title'), item: absoluteUrl(locale, '/blog') },
              { '@type': 'ListItem', position: 3, name: post.title, item: url },
            ],
          },
        ]}
      />
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t('back')}
      </Link>
      <p className="mt-8 text-sm text-muted-foreground">
        {post.category}, <time dateTime={post.date}>{formatDay(locale, parseDateOnly(post.date), 'medium')}</time>,{' '}
        {t('minutes', { count: post.readingMinutes })}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
        {post.title}
      </h1>
      <p className="mt-5 text-xl leading-relaxed text-muted-foreground">{post.description}</p>
      <div className="mt-6 max-w-[68ch]">
        <ContentBlocks blocks={post.body} />
      </div>

      <aside className="mt-16 rounded-3xl bg-ink p-8 text-ink-foreground">
        <p className="font-display text-2xl font-semibold">{t('ctaTitle')}</p>
        <p className="mt-2 text-ink-foreground/70">{t('ctaText')}</p>
        <Button asChild className="mt-5 bg-highlight text-highlight-foreground hover:bg-highlight/90">
          <Link href="/#demo">{t('ctaButton')}</Link>
        </Button>
      </aside>

      {more.length > 0 && (
        <nav aria-labelledby="more-posts" className="mt-16">
          <h2 id="more-posts" className="font-display text-xl font-semibold text-foreground">
            {t('more')}
          </h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {more.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block py-4">
                  <span className="block font-medium text-foreground group-hover:text-primary">{p.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{p.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </article>
  )
}
