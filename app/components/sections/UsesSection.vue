<script setup lang="ts">
const uses = [
  {
    title: 'Local AI inference',
    desc: 'Run open-weight models yourself with Ollama or llama.cpp — coding help, chat, or RAG over your own documents, with nothing metered per token and nothing leaving the house.',
    icon: `<circle cx="20" cy="20" r="4.5" stroke="#5b8cff" stroke-width="2"/><circle cx="8" cy="10" r="2.4" stroke="#5b8cff" stroke-width="2"/><circle cx="32" cy="10" r="2.4" stroke="#5b8cff" stroke-width="2"/><circle cx="8" cy="30" r="2.4" stroke="#5b8cff" stroke-width="2"/><circle cx="32" cy="30" r="2.4" stroke="#5b8cff" stroke-width="2"/><path d="M16.5 17.5 L10 12 M23.5 17.5 L30 12 M16.5 22.5 L10 28 M23.5 22.5 L30 28" stroke="#5b8cff" stroke-width="1.6"/>`,
  },
  {
    title: 'Your own drive',
    desc: 'A NAS with real RAID — TrueNAS or OpenMediaVault — backed up on your terms instead of a subscription you renew every year.',
    icon: `<rect x="6" y="8" width="28" height="8" rx="1.5" stroke="#5b8cff" stroke-width="2"/><rect x="6" y="18" width="28" height="8" rx="1.5" stroke="#5b8cff" stroke-width="2"/><rect x="6" y="28" width="28" height="4" rx="1" stroke="#5b8cff" stroke-width="2"/><circle cx="11" cy="12" r="1.3" fill="#5b8cff"/><circle cx="11" cy="22" r="1.3" fill="#5b8cff"/>`,
  },
  {
    title: 'Plex, on your terms',
    desc: 'The movies, shows, and music you already own — streamed to every TV and phone in the house, no monthly fee attached.',
    icon: `<rect x="5" y="8" width="30" height="20" rx="2" stroke="#5b8cff" stroke-width="2"/><path d="M17 14 L25 18 L17 22 Z" fill="#5b8cff"/><line x1="14" y1="32" x2="26" y2="32" stroke="#5b8cff" stroke-width="2"/>`,
  },
  {
    title: 'Websites & a git server',
    desc: 'A portfolio site, a Gitea instance, a staging environment for client work — reachable from anywhere, controlled by no one else.',
    icon: `<rect x="5" y="8" width="30" height="24" rx="2" stroke="#5b8cff" stroke-width="2"/><line x1="5" y1="15" x2="35" y2="15" stroke="#5b8cff" stroke-width="2"/><circle cx="10" cy="11.5" r="1.1" fill="#5b8cff"/><circle cx="14" cy="11.5" r="1.1" fill="#5b8cff"/>`,
  },
  {
    title: 'Home automation hub',
    desc: "Home Assistant doesn't need the cloud to turn the lights on — a rack unit is a steadier home for it than a drawer under the router.",
    icon: `<path d="M20 6 L35 17 V33 H5 V17 Z" stroke="#5b8cff" stroke-width="2" stroke-linejoin="round"/><rect x="16" y="22" width="8" height="11" stroke="#5b8cff" stroke-width="2"/>`,
  },
  {
    title: 'Network utilities',
    desc: 'Pi-hole, WireGuard, a reverse proxy — the unglamorous infrastructure that makes everything else on the network feel faster and safer.',
    icon: `<path d="M20 5 L33 10 V19 C33 27 27 33 20 35 C13 33 7 27 7 19 V10 Z" stroke="#5b8cff" stroke-width="2" stroke-linejoin="round"/><path d="M14 20 L18 24 L27 14" stroke="#5b8cff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
]

const reveals = useStaggeredReveal(uses.length)
</script>

<template>
  <section id="uses" class="py-13 sm:py-20">
    <div class="mx-auto max-w-[1180px] px-5 sm:px-8">
      <div class="mb-11 max-w-[560px]">
        <div class="mb-3 font-mono text-[11.5px] tracking-[0.1em] text-blue uppercase">What goes inside</div>
        <h2 class="mb-3 font-display text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.01em]">
          One case, a dozen builds
        </h2>
        <p class="max-w-[520px] text-[15.5px] text-text-dim">
          Homerack doesn't come with any of this — it's just the case. 10U (or 5U) of standard
          rack space for whatever you rack inside it, so you can stop paying for things you can
          run yourself.
        </p>
      </div>
      <div class="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(item, i) in uses"
          :key="item.title"
          :ref="(el) => (reveals[i]!.target.value = el as HTMLElement)"
          class="reveal bg-surface px-5.5 py-6.5 transition-transform duration-300 hover:-translate-y-1"
          :class="{ 'reveal-visible': reveals[i]!.isVisible.value }"
          :style="reveals[i]!.style.value"
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" class="mb-4" v-html="item.icon" />
          <h3 class="mb-2 font-display text-[15.5px] font-semibold">{{ item.title }}</h3>
          <p class="text-[13px] leading-relaxed text-text-dim">{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
