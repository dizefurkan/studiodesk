import { notFound } from 'next/navigation'

// Unknown paths under a locale render app/[locale]/not-found.tsx (with translations)
export default function CatchAllPage() {
  notFound()
}
