<script setup lang="ts">
const links = [
  { href: '#viewer', label: 'Blueprint' },
  { href: '#uses', label: 'What it runs' },
  { href: '#attachments', label: 'Rack units' },
  { href: '#lifestyle', label: 'In the room' },
  { href: '#family', label: 'R1 / R.5' },
]
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
    </div>
  </nav>
</template>
