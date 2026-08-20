<script setup lang="ts">
const specs = [
  { k: 'Footprint', v: '252 × 252mm' },
  { k: 'Height', v: '500 / 250mm' },
  { k: 'Capacity', v: '10U / 5U' },
  { k: 'Mounting', v: 'EIA-310' },
  { k: 'Fasteners', v: '26 rivets' },
  { k: 'Finish', v: 'Raw / RAL9010 / RAL9005' },
]
</script>

<template>
  <section class="border-y border-line bg-surface">
    <div class="mx-auto grid max-w-[1180px] grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      <div
        v-for="(spec, i) in specs"
        :key="spec.k"
        class="border-line px-5 py-5.5"
        :class="{ 'border-r': i !== specs.length - 1 }"
      >
        <div class="mb-1.5 font-mono text-[10px] tracking-[0.08em] text-text-faint uppercase">{{ spec.k }}</div>
        <div class="font-mono text-[15px] font-medium text-text">{{ spec.v }}</div>
      </div>
    </div>
  </section>
</template>
