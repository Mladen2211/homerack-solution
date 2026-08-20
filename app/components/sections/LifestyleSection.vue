<script setup lang="ts">
type RoomKey = 'office' | 'living' | 'studio'

const emit = defineEmits<{ 'room-change': [finish: Finish] }>()

const ROOMS: Record<
  RoomKey,
  { label: string; sub: string; finish: Finish; finishLabel: string; headline: string; copy: string; bg: string }
> = {
  office: {
    label: 'Office',
    sub: 'Desk-side, next to a monitor arm',
    finish: 'white',
    finishLabel: 'Powder white',
    headline: 'At home behind a monitor',
    copy: 'Sits next to a monitor arm without stealing desk space. Vented sides keep small fans from working overtime, so it stays quiet enough to sit in earshot all day.',
    bg: 'radial-gradient(120% 90% at 15% 10%, #33415e 0%, transparent 55%), linear-gradient(150deg, #232733 0%, #171920 70%)',
  },
  living: {
    label: 'Living room',
    sub: 'Under the TV, beside a receiver',
    finish: 'black',
    finishLabel: 'Powder black',
    headline: 'At home under the TV',
    copy: 'Reads as AV equipment, not IT equipment — no exposed cabling, no acid-green LEDs, nothing that looks like it wandered out of a server closet.',
    bg: 'radial-gradient(120% 90% at 85% 15%, #7a4a26 0%, transparent 55%), linear-gradient(150deg, #2e2015 0%, #1c140d 70%)',
  },
  studio: {
    label: 'Bedroom & studio',
    sub: 'Compact, quiet, out of the way',
    finish: 'raw',
    finishLabel: 'Raw aluminium',
    headline: 'At home in a bedroom or studio',
    copy: "Compact enough for a corner of a room you actually sleep or work in — quiet construction means it won't fight with a vocal booth, and raw aluminium keeps the industrial edge.",
    bg: 'radial-gradient(120% 90% at 50% 0%, #565b66 0%, transparent 55%), linear-gradient(150deg, #26282c 0%, #17181b 70%)',
  },
}
const roomKeys = Object.keys(ROOMS) as RoomKey[]

const activeRoom = ref<RoomKey>('office')
const current = computed(() => ROOMS[activeRoom.value])

function selectRoom(key: RoomKey) {
  activeRoom.value = key
  emit('room-change', ROOMS[key].finish)
}

const { target, isVisible, style } = useScrollReveal()
</script>

<template>
  <section id="lifestyle" class="py-13 sm:py-20">
    <div class="mx-auto max-w-[1180px] px-5 sm:px-8">
      <div class="mb-11 max-w-[560px]">
        <div class="mb-3 font-mono text-[11.5px] tracking-[0.1em] text-blue uppercase">Where it lives</div>
        <h2 class="mb-3 font-display text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.01em]">
          Sleek enough for the office, quiet enough for the living room
        </h2>
        <p class="max-w-[520px] text-[15.5px] text-text-dim">
          Same cabinet, different mood depending on the finish. Pick a room — it'll swap the
          finish on the blueprint above to match.
        </p>
      </div>

      <div
        :ref="(el) => (target = el as HTMLElement | null)"
        class="reveal rounded-2xl border border-line bg-surface p-2"
        :class="{ 'reveal-visible': isVisible }"
        :style="style"
      >
        <div class="flex flex-wrap gap-2 p-2.5">
          <button
            v-for="key in roomKeys"
            :key="key"
            class="min-w-[150px] flex-1 rounded-[9px] border px-3.5 py-3 text-left font-mono text-xs tracking-[0.03em] transition-all duration-150"
            :class="
              activeRoom === key
                ? 'border-amber-dim bg-[#26201a] text-amber'
                : 'border-line bg-surface-2 text-text-dim hover:border-[#3a3f4c]'
            "
            @click="selectRoom(key)"
          >
            <span
              class="mb-0.5 block font-display text-[14.5px] font-semibold tracking-normal"
              :class="activeRoom === key ? 'text-amber' : 'text-text'"
              >{{ ROOMS[key].label }}</span
            >
            {{ ROOMS[key].sub }}
          </button>
        </div>

        <div class="relative m-0.5 min-h-[280px] overflow-hidden rounded-[11px]">
          <div
            v-for="key in roomKeys"
            :key="key"
            class="absolute inset-0 transition-opacity duration-500"
            :class="activeRoom === key ? 'opacity-100' : 'opacity-0'"
            :style="{ background: ROOMS[key].bg }"
          />
          <div class="relative max-w-[520px] p-7.5 sm:p-11">
            <div class="mb-4 font-mono text-xs tracking-[0.06em] text-text-faint uppercase">
              Suggested finish — <b class="font-semibold text-amber">{{ current.finishLabel }}</b>
            </div>
            <h3 class="mb-3.5 font-display text-[clamp(24px,3vw,30px)] font-semibold tracking-[-0.01em]">
              {{ current.headline }}
            </h3>
            <p class="text-[15px] leading-relaxed text-text-dim">{{ current.copy }}</p>
          </div>
        </div>
      </div>
      <div class="px-0 py-3.5 text-center font-mono text-[10.5px] tracking-[0.04em] text-text-faint">
        designed to be seen, not hidden — no exposed cabling, no branding, no acid-green LEDs
      </div>
    </div>
  </section>
</template>
