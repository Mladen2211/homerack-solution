export function useScrollReveal(delayMs = 0) {
  const target = ref<HTMLElement | null>(null)
  const isVisible = ref(false)

  const { stop } = useIntersectionObserver(
    target,
    ([entry]) => {
      if (entry?.isIntersecting) {
        isVisible.value = true
        stop()
      }
    },
    { threshold: 0.15 },
  )

  const style = computed(() => (delayMs ? { animationDelay: `${delayMs}ms` } : undefined))

  return { target, isVisible, style }
}

/** A useScrollReveal() per item, staggered by index — the repeated pattern behind
 * every grid of reveal-on-scroll cards (uses, attachments, family lineup). */
export function useStaggeredReveal(count: number, stepMs = 70) {
  return Array.from({ length: count }, (_, i) => useScrollReveal(i * stepMs))
}
