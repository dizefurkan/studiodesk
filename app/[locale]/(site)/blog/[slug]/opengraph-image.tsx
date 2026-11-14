import { getTranslations } from 'next-intl/server'
import { OG_SIZE, ogImage } from '@/lib/og'
import { getPost, localeParams } from '@/content/blog'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'StudioDesk Blog'

export function generateStaticParams() {
  return localeParams()
}

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'site.blog' })
  const post = getPost(locale, slug)
  return ogImage({ title: post?.title ?? t('title'), label: post ? `${t('title')}, ${post.category}` : 'studiodesk.app' })
}
