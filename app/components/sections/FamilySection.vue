<script setup lang="ts">
const family = [
  {
    tag: 'FULL HEIGHT',
    name: 'Homerack R1',
    sub: 'The standard cabinet — a full 10U of usable rack space.',
    active: true,
    specs: [
      { k: 'Height', v: '500mm' },
      { k: 'Capacity', v: '10U' },
      { k: 'Clearance', v: '~28mm top/bottom' },
      { k: 'Rivets', v: '10' },
    ],
  },
  {
    tag: 'HALF HEIGHT',
    name: 'Homerack R.5',
    sub: 'For a router, a switch, and one small server — nothing more.',
    active: false,
    specs: [
      { k: 'Height', v: '250mm' },
      { k: 'Capacity', v: '5U' },
      { k: 'Clearance', v: '~14mm top/bottom' },
      { k: 'Rivets', v: '10' },
    ],
  },
]

const reveals = useStaggeredReveal(family.length)
</script>

<template>
  <section id="family" class="py-13 sm:py-20">
    <div class="mx-auto max-w-[1180px] px-5 sm:px-8">
      <div class="mb-11 max-w-[560px]">
        <div class="mb-3 font-mono text-[11.5px] tracking-[0.1em] text-blue uppercase">The lineup</div>
        <h2 class="mb-3 font-display text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.01em]">
          Two heights, one part system
        </h2>
        <p class="max-w-[520px] text-[15.5px] text-text-dim">
          Same 312×312mm footprint, same welded frame, same mounting standard — R.5 is just R1
          with the height parameter halved.
        </p>
      </div>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div
          v-for="(card, i) in family"
          :key="card.name"
          :ref="(el) => (reveals[i]!.target.value = el as HTMLElement)"
          class="reveal relative overflow-hidden rounded-2xl border bg-surface p-7.5 transition-transform duration-300 hover:-translate-y-1"
          :class="[card.active ? 'border-amber-dim' : 'border-line', { 'reveal-visible': reveals[i]!.isVisible.value }]"
          :style="reveals[i]!.style.value"
        >
          <div class="absolute top-0 right-0 rounded-bl-lg bg-amber px-2.5 py-1 font-mono text-[10px] tracking-[0.05em] text-[#0e0f13]">
            {{ card.tag }}
          </div>
          <h4 class="mb-1.5 font-display text-2xl font-bold">{{ card.name }}</h4>
          <div class="mb-5.5 text-[13px] text-text-dim">{{ card.sub }}</div>
          <div class="grid grid-cols-2 gap-3.5 font-mono text-[12.5px]">
            <div v-for="spec in card.specs" :key="spec.k">
              <div class="mb-0.5 text-[10px] tracking-[0.06em] text-text-faint uppercase">{{ spec.k }}</div>
              <div class="text-text">{{ spec.v }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
