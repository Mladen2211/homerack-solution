<script setup lang="ts">
const facts = [
  { value: '252×252mm', label: 'footprint' },
  { value: '26', label: 'rivets' },
  { value: 'EIA-310', label: 'universal mounting' },
  { value: '2', label: 'heights — R1 & R.5' },
]
</script>

<template>
  <section class="mx-auto max-w-[1180px] px-5 pt-9 pb-5 sm:px-8 sm:pt-16 sm:pb-5">
    <div
      class="animate-fade-up mb-4.5 flex items-center gap-2.5 font-mono text-xs tracking-[0.12em] text-amber uppercase before:h-px before:w-5.5 before:bg-amber-dim before:content-['']"
    >
      10-inch rack cabinet · home-lab hardware
    </div>
    <h1
      class="animate-fade-up mb-5.5 font-display text-[clamp(42px,7vw,84px)] leading-[0.98] font-bold tracking-[-0.02em]"
      style="animation-delay: 90ms"
    >
      Rack gear,<br />
      <span class="text-text-faint">without the rack tax.</span>
    </h1>
    <p
      class="animate-fade-up mb-2 max-w-[600px] text-[17px] text-text-dim"
      style="animation-delay: 180ms"
    >
      A 10" server cabinet designed around a simple, riveted aluminium frame —
      <b class="font-semibold text-text">standard EIA-310 mounting spacing</b> throughout, so any
      rack-eared gear fits, whatever the parts end up being underneath.
    </p>
    <div
      class="animate-fade-up mt-6.5 flex flex-wrap gap-5.5 font-mono text-xs text-text-faint"
      style="animation-delay: 260ms"
    >
      <span v-for="fact in facts" :key="fact.label">
        <b class="font-medium text-text-dim">{{ fact.value }}</b> {{ fact.label }}
      </span>
    </div>
  </section>
</template>
