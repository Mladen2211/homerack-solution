<script setup lang="ts">
const attachments = [
  {
    title: 'ITX-2U — compute node',
    desc: 'Mini-ITX board plus a flex-ATX PSU — sized around a Ryzen AI Max-class SoC for running local LLMs without the case sitting exposed on a desk.',
    file: 'ITX-2U.3mf',
    ext: '.3mf',
    size: '0.40 MB',
    icon: `<rect x="4" y="10" width="32" height="20" rx="1.5" stroke="#e2793a" stroke-width="2"/><rect x="9" y="15" width="10" height="10" stroke="#e2793a" stroke-width="1.6"/><line x1="23" y1="15" x2="31" y2="15" stroke="#e2793a" stroke-width="1.6"/><line x1="23" y1="19" x2="31" y2="19" stroke="#e2793a" stroke-width="1.6"/><line x1="23" y1="23" x2="31" y2="23" stroke="#e2793a" stroke-width="1.6"/>`,
  },
  {
    title: '2U-NAS — hot-swap storage',
    desc: 'A hot-swap drive bay sized for a real NAS build — pull or replace a disk without powering anything down.',
    file: '2U-NAS.stl',
    ext: '.stl',
    size: '5.43 MB',
    icon: `<rect x="6" y="7" width="28" height="26" rx="1.5" stroke="#e2793a" stroke-width="2"/><line x1="6" y1="16" x2="34" y2="16" stroke="#e2793a" stroke-width="1.6"/><line x1="6" y1="24" x2="34" y2="24" stroke="#e2793a" stroke-width="1.6"/><circle cx="29" cy="11.5" r="1.2" fill="#e2793a"/><circle cx="29" cy="20" r="1.2" fill="#e2793a"/><circle cx="29" cy="28.5" r="1.2" fill="#e2793a"/>`,
  },
  {
    title: 'Node-1U — Tiny PC sled',
    desc: 'A mounting sled for Lenovo ThinkCentre Tiny-class PCs (M920Q and similar) — turns a shelf of loose mini PCs into one rack unit each.',
    file: 'Node-1U.3mf',
    ext: '.3mf',
    size: '0.20 MB',
    icon: `<rect x="4" y="15" width="32" height="10" rx="1.5" stroke="#e2793a" stroke-width="2"/><rect x="8" y="18" width="6" height="4" fill="#e2793a" fill-opacity="0.3"/>`,
  },
  {
    title: 'Switch-1U — network switch mount',
    desc: 'A clean 1U home for a small managed or unmanaged switch, instead of it dangling off a shelf bracket behind the router.',
    file: 'Switch-1U.3mf',
    ext: '.3mf',
    size: '0.02 MB',
    icon: `<rect x="4" y="16" width="32" height="8" rx="1.5" stroke="#e2793a" stroke-width="2"/><circle cx="10" cy="20" r="1.3" fill="#e2793a"/><circle cx="15" cy="20" r="1.3" fill="#e2793a"/><circle cx="20" cy="20" r="1.3" fill="#e2793a"/><circle cx="25" cy="20" r="1.3" fill="#e2793a"/><circle cx="30" cy="20" r="1.3" fill="#e2793a"/>`,
  },
  {
    title: 'NUC + SSD cage',
    desc: 'Mounts a NUC alongside an external SSD cage — compact compute with its own directly-attached storage, no cable draped across the desk.',
    file: 'NUC-rack-with-ssd-cage.3mf',
    ext: '.3mf',
    size: '0.09 MB',
    icon: `<rect x="4" y="12" width="18" height="16" rx="1.5" stroke="#e2793a" stroke-width="2"/><rect x="24" y="16" width="12" height="10" rx="1.5" stroke="#e2793a" stroke-width="1.6"/>`,
  },
]

const reveals = useStaggeredReveal(attachments.length + 1)
</script>

<template>
  <section id="attachments" class="py-13 sm:py-20">
    <div class="mx-auto max-w-[1180px] px-5 sm:px-8">
      <div class="mb-11 max-w-[560px]">
        <div class="mb-3 font-mono text-[11.5px] tracking-[0.1em] text-blue uppercase">Rack units</div>
        <h2 class="mb-3 font-display text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.01em]">
          Designed to be filled, not just built
        </h2>
        <p class="max-w-[520px] text-[15.5px] text-text-dim">
          A rack is only as useful as what slides into it. These modules are purpose-built for
          this cabinet's 222mm clear bay — and any 10", U-height 3D-printed unit will fit
          alongside them.
        </p>
      </div>
      <div class="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(item, i) in attachments"
          :key="item.file"
          :ref="(el) => (reveals[i]!.target.value = el as HTMLElement)"
          class="reveal bg-surface px-5.5 py-6.5 transition-transform duration-300 hover:-translate-y-1"
          :class="{ 'reveal-visible': reveals[i]!.isVisible.value }"
          :style="reveals[i]!.style.value"
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" class="mb-4" v-html="item.icon" />
          <h3 class="mb-2 font-display text-[15.5px] font-semibold">{{ item.title }}</h3>
          <p class="text-[13px] leading-relaxed text-text-dim">{{ item.desc }}</p>
          <a
            :href="`/downloads/${item.file}`"
            :download="item.file"
            class="mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-amber-dim px-3 py-1.5 font-mono text-[11.5px] text-amber transition-colors duration-150 hover:bg-amber hover:text-[#1a1005]"
          >
            Download {{ item.ext }}
            <span class="font-normal text-text-faint">· {{ item.size }}</span>
          </a>
        </div>
        <div
          :ref="(el) => (reveals[attachments.length]!.target.value = el as HTMLElement)"
          class="reveal bg-surface px-5.5 py-6.5"
          :class="{ 'reveal-visible': reveals[attachments.length]!.isVisible.value }"
          :style="reveals[attachments.length]!.style.value"
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" class="mb-4">
            <rect x="6" y="6" width="28" height="28" rx="2" stroke="#9ba0ac" stroke-width="2" stroke-dasharray="3 3" />
            <path d="M20 14 V26 M14 20 H26" stroke="#9ba0ac" stroke-width="2" />
          </svg>
          <h3 class="mb-2 font-display text-[15.5px] font-semibold">...and anything else</h3>
          <p class="text-[13px] leading-relaxed text-text-dim">
            The bay is a plain 222mm-wide, U-height opening — any 10" 3D-printed module built to
            that spec slides in the same way these do.
          </p>
        </div>
      </div>
      <div class="pt-2.5 pb-5.5 text-center font-mono text-[10px] tracking-[0.04em] text-text-faint">
        reference models, sized against this cabinet's dimensions — download links above,
        generated straight from the source files
      </div>
    </div>
  </section>
</template>
