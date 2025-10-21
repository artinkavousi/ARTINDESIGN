'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  y?: number
  className?: string
}

/**
 * ScrollReveal - Reveal elements on scroll with GSAP
 */
export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.8,
  y = 60,
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y,
        opacity: 0,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    }, ref)

    return () => ctx.revert()
  }, [delay, duration, y])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/**
 * ParallaxSection - Parallax scrolling effect
 */
interface ParallaxSectionProps {
  children: React.ReactNode
  speed?: number
  className?: string
}

export function ParallaxSection({
  children,
  speed = 0.5,
  className,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        yPercent: -50 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, ref)

    return () => ctx.revert()
  }, [speed])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/**
 * TextReveal - Reveal text word by word on scroll
 */
interface TextRevealProps {
  children: string
  className?: string
  stagger?: number
}

export function TextReveal({
  children,
  className,
  stagger = 0.05,
}: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const words = children.split(' ')
    ref.current.innerHTML = words
      .map((word) => `<span class="inline-block opacity-0">${word}&nbsp;</span>`)
      .join('')

    const ctx = gsap.context(() => {
      gsap.to(ref.current!.children, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    }, ref)

    return () => ctx.revert()
  }, [children, stagger])

  return <div ref={ref} className={className} />
}

/**
 * PinSection - Pin element during scroll
 */
interface PinSectionProps {
  children: React.ReactNode
  duration?: string
  className?: string
}

export function PinSection({
  children,
  duration = '100%',
  className,
}: PinSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top top',
        end: `+=${duration}`,
        pin: true,
        pinSpacing: true,
      })
    }, ref)

    return () => ctx.revert()
  }, [duration])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

