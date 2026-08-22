<script setup lang="ts">
const links = [
  { href: '#viewer', label: 'Blueprint' },
  { href: '#uses', label: 'What it runs' },
  { href: '#attachments', label: 'Rack units' },
  { href: '#lifestyle', label: 'In the room' },
  { href: '#family', label: 'R1 / R.5' },
]

const mobileOpen = ref(false)
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-line bg-bg/86 backdrop-blur-md">
    <div class="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-3.5 sm:px-8 sm:py-4">
      <div class="flex items-center gap-2 font-display text-lg font-bold tracking-wide">
        <span class="inline-block h-2 w-2 rounded-sm bg-amber" />
        HOMERACK
      </div>
      <div class="hidden gap-7 text-[13.5px] text-text-dim sm:flex">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="transition-colors duration-150 hover:text-text"
        >
          {{ link.label }}
        </a>
      </div>

      <button
        type="button"
        class="-mr-1.5 cursor-pointer rounded-md p-2 text-text-dim transition-[color,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-text active:scale-90 sm:hidden"
        :aria-expanded="mobileOpen"
        aria-controls="mobile-nav"
        aria-label="Toggle menu"
        @click="mobileOpen = !mobileOpen"
      >
        <!-- three-line hamburger that morphs to an X in place, rather than swapping
             icons — the lines carry the same identity across states, matching the
             enter/exit-along-the-same-path feel used everywhere else in this menu. -->
        <span class="relative flex h-5 w-5 flex-col items-center justify-center">
          <span
            class="absolute h-[1.5px] w-4.5 rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :class="mobileOpen ? 'translate-y-0 rotate-45' : '-translate-y-[5px] rotate-0'"
          />
          <span
            class="absolute h-[1.5px] w-4.5 rounded-full bg-current transition-opacity duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :class="mobileOpen ? 'opacity-0' : 'opacity-100'"
          />
          <span
            class="absolute h-[1.5px] w-4.5 rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :class="mobileOpen ? 'translate-y-0 -rotate-45' : 'translate-y-[5px] rotate-0'"
          />
        </span>
      </button>
    </div>

    <!-- Enter/leave share the same path (drops down from the nav, dismisses back up
         into it) with mirrored easing curves — the leave curve is the enter curve's
         cubic-bezier reflected through its center, so the return trip reads as the
         same motion in reverse rather than a generic fade. A slight scale (rather
         than opacity alone) reads as the panel materializing, not just appearing. -->
    <Transition
      enter-active-class="transition-all duration-220 ease-[cubic-bezier(0.16,1,0.3,1)]"
      leave-active-class="transition-all duration-220 ease-[cubic-bezier(0.7,0,0.84,0)]"
      enter-from-class="opacity-0 -translate-y-1.5 scale-[0.98]"
      leave-to-class="opacity-0 -translate-y-1.5 scale-[0.98]"
    >
      <div
        v-if="mobileOpen"
        id="mobile-nav"
        class="absolute top-full right-0 left-0 origin-top border-t border-line bg-bg/95 backdrop-blur-md sm:hidden"
      >
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="block border-b border-line px-5 py-3.5 text-[14px] text-text-dim transition-colors duration-150 last:border-b-0 hover:text-text"
          @click="mobileOpen = false"
        >
          {{ link.label }}
        </a>
      </div>
    </Transition>
  </nav>
</template>
