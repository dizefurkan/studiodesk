'use client'

import { useState, useSyncExternalStore } from 'react'
import Lottie from 'lottie-react'
import animationData from '@/components/brand/empty-dancer.json'

// Frames of components/brand/empty-dancer.json: 0–60 draws the mark, 60–180 is a seamless sway loop.
const INTRO: [number, number] = [0, 60]
const LOOP: [number, number] = [60, 180]
const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const useReducedMotion = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)

export default function DancerAnimation({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<'intro' | 'loop'>('intro')

  if (reduced) {
    // static, fully drawn mark
    return <Lottie animationData={animationData} initialSegment={[LOOP[0], LOOP[0] + 1]} autoplay={false} loop={false} className={className} aria-hidden />
  }

  return phase === 'intro' ? (
    <Lottie
      key="intro"
      animationData={animationData}
      initialSegment={INTRO}
      loop={false}
      onComplete={() => setPhase('loop')}
      className={className}
      aria-hidden
    />
  ) : (
    <Lottie key="loop" animationData={animationData} initialSegment={LOOP} loop className={className} aria-hidden />
  )
}
