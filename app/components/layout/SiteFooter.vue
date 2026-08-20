<script setup lang="ts">
// FINISH_COLORS is the same swatch source the 3D viewer's materials use.
const finishSwatches = [FINISH_COLORS.raw, FINISH_COLORS.white, FINISH_COLORS.black]
</script>

<template>
  <footer class="border-t border-line py-10 pb-12">
    <div class="mx-auto flex max-w-[1180px] flex-wrap items-end justify-between gap-6 px-5 sm:px-8">
      <div>
        <div class="mb-2 flex items-center gap-2 font-display text-lg font-bold tracking-wide">
          <span class="inline-block h-2 w-2 rounded-sm bg-amber" />
          HOMERACK
        </div>
        <div class="text-xs text-text-faint">
          A home-lab hardware project. <b class="text-text-dim">Concept / prototype stage</b> — parts
          and dimensions subject to change.
        </div>
      </div>
      <div>
        <div class="flex items-center gap-2.5">
          <div
            v-for="color in finishSwatches"
            :key="color"
            class="h-5 w-5 rounded-md border border-line"
            :style="{ background: color }"
          />
        </div>
        <div class="mt-2 text-xs text-text-faint">Raw · Powder white · Powder black</div>
      </div>
    </div>
  </footer>
</template>
