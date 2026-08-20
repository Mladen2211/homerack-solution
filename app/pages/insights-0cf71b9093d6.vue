<script setup lang="ts">
// Unauthenticated by design (no login on this site) — kept private by an unguessable
// path instead, per the user's explicit choice. robots:false keeps it out of the
// sitemap and out of crawlers, as defense in depth on top of the path itself. Never
// link to this route from anywhere public.
definePageMeta({ robots: false })

interface InsightsOption {
  option: string
  count: number
}

interface InsightsResponse {
  total: number
  updatedAt: string
  firstResponseAt: string | null
  interest: InsightsOption[]
  sizes: InsightsOption[]
  comments: { id: number; comment: string; createdAt: string }[]
}

const { data, refresh } = await useFetch<InsightsResponse>('/api/insights-0cf71b9093d6', {
  key: 'survey-insights',
})

const REFRESH_MS = 20_000
const refreshing = ref(false)
useIntervalFn(async () => {
  refreshing.value = true
  await refresh()
  refreshing.value = false
}, REFRESH_MS)

async function refreshNow() {
  refreshing.value = true
  await refresh()
  refreshing.value = false
}

// Ordinal ramp (one hue, monotone lightness) — strongest signal first. Validated
// against this page's card surface (#1b1d24) with the dataviz skill's --ordinal
// check: lightness monotone, adjacent ΔL >= 0.06, darkest step still 2.26:1 on
// surface. Holds the site's brand blue hue/chroma (#5b8cff), stepped for contrast.
const INTEREST_COLORS: Record<string, string> = {
  'Yes, definitely': '#6c9fff',
  'Maybe, depends on price': '#5585f7',
  'Just curious': '#3e6cdc',
  'Not really': '#244cba',
}
// Single series (nominal categories, "pick any") -> one flat hue, no ramp. Theme amber.
const SIZE_COLOR = '#e2793a'

const showInterestTable = ref(false)
const showSizeTable = ref(false)

const interestTotal = computed(() => data.value?.interest.reduce((sum, r) => sum + r.count, 0) ?? 0)

const positivePct = computed(() => {
  if (!data.value || interestTotal.value === 0) return null
  const positive = data.value.interest
    .filter((r) => r.option === 'Yes, definitely' || r.option === 'Maybe, depends on price')
    .reduce((sum, r) => sum + r.count, 0)
  return Math.round((positive / interestTotal.value) * 100)
})

const topSize = computed(() => {
  if (!data.value?.sizes.length) return null
  const sorted = [...data.value.sizes].sort((a, b) => b.count - a.count)
  return sorted[0] && sorted[0].count > 0 ? sorted[0] : null
})

function pctOf(count: number, total: number) {
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

function barWidthPct(count: number, options: InsightsOption[]) {
  const max = Math.max(1, ...options.map((o) => o.count))
  if (count === 0) return 0
  return Math.max(3, (count / max) * 100)
}

const lastUpdatedLabel = computed(() => {
  if (!data.value?.updatedAt) return ''
  return new Date(data.value.updatedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const collectingSinceLabel = computed(() => {
  if (!data.value?.firstResponseAt) return null
  return new Date(data.value.firstResponseAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}
</script>

<template>
  <section class="py-13 sm:py-20">
    <div class="mx-auto max-w-[1180px] px-5 sm:px-8">
      <div class="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div class="mb-3 font-mono text-[11.5px] tracking-[0.1em] text-blue uppercase">Internal</div>
          <h1 class="mb-2 font-display text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.01em]">
            Survey results
          </h1>
          <p class="max-w-[520px] text-[15.5px] text-text-dim">
            Live view of the feedback survey on the landing page.
            <template v-if="collectingSinceLabel"> Collecting responses since {{ collectingSinceLabel }}.</template>
          </p>
        </div>

        <div class="flex items-center gap-3 font-mono text-[11.5px] text-text-faint">
          <span class="flex items-center gap-1.5">
            <span class="relative flex h-1.5 w-1.5">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue opacity-75"
                :class="{ 'opacity-0': !refreshing }"
              />
              <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue" />
            </span>
            live
          </span>
          <span v-if="lastUpdatedLabel">updated {{ lastUpdatedLabel }}</span>
          <button
            type="button"
            class="cursor-pointer rounded-md border border-line px-2.5 py-1 text-text-dim transition-colors duration-150 hover:border-[#3a3f4c] hover:text-text disabled:cursor-default disabled:opacity-50"
            :disabled="refreshing"
            @click="refreshNow"
          >
            {{ refreshing ? 'Refreshing…' : 'Refresh now' }}
          </button>
        </div>
      </div>

      <div v-if="!data || data.total === 0" class="rounded-2xl border border-line bg-surface p-11 text-center">
        <h2 class="mb-2 font-display text-[20px] font-semibold">No responses yet</h2>
        <p class="mx-auto max-w-[420px] text-sm text-text-dim">
          Nothing's come in from the landing page survey so far — this page updates itself, so just leave it open.
        </p>
      </div>

      <template v-else>
        <!-- KPI row -->
        <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="rounded-2xl border border-line bg-surface p-6">
            <div class="mb-2 font-mono text-[11px] tracking-[0.06em] text-text-faint uppercase">Total responses</div>
            <div class="font-display text-[34px] font-semibold">{{ data.total }}</div>
          </div>
          <div class="rounded-2xl border border-line bg-surface p-6">
            <div class="mb-2 font-mono text-[11px] tracking-[0.06em] text-text-faint uppercase">
              Positive interest
            </div>
            <div class="font-display text-[34px] font-semibold">
              {{ positivePct === null ? '—' : `${positivePct}%` }}
            </div>
            <div class="mt-1 text-[12px] text-text-faint">"Yes, definitely" + "Maybe, depends on price"</div>
          </div>
          <div class="rounded-2xl border border-line bg-surface p-6">
            <div class="mb-2 font-mono text-[11px] tracking-[0.06em] text-text-faint uppercase">Top size pick</div>
            <div class="font-display text-[22px] font-semibold">{{ topSize ? topSize.option : '—' }}</div>
            <div v-if="topSize" class="mt-1 text-[12px] text-text-faint">{{ topSize.count }} picks</div>
          </div>
        </div>

        <!-- Interest chart -->
        <div class="mb-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 class="font-display text-[18px] font-semibold">Would you buy a Homerack?</h2>
            <button
              type="button"
              class="cursor-pointer font-mono text-[11px] tracking-[0.06em] text-text-faint uppercase transition-colors duration-150 hover:text-text-dim"
              @click="showInterestTable = !showInterestTable"
            >
              {{ showInterestTable ? 'View chart' : 'View as table' }}
            </button>
          </div>

          <div v-if="!showInterestTable" class="flex flex-col gap-4">
            <div v-for="row in data.interest" :key="row.option" class="group">
              <div class="mb-1.5 flex items-baseline justify-between gap-3 text-[13.5px]">
                <span class="text-text-dim">{{ row.option }}</span>
                <span class="font-mono text-[12px] text-text-faint">
                  {{ row.count }} · {{ pctOf(row.count, interestTotal) }}%
                </span>
              </div>
              <div class="h-3 w-full rounded-full bg-surface-2" :title="`${row.option}: ${row.count} responses`">
                <div
                  class="h-3 rounded-full transition-[width] duration-500 ease-out"
                  :style="{
                    width: `${barWidthPct(row.count, data.interest)}%`,
                    backgroundColor: INTEREST_COLORS[row.option],
                  }"
                />
              </div>
            </div>
          </div>

          <table v-else class="w-full text-left text-[13.5px]">
            <thead>
              <tr class="border-b border-line text-text-faint">
                <th class="pb-2 pr-4 font-mono text-[11px] font-normal tracking-[0.06em] uppercase">Answer</th>
                <th class="pb-2 pr-4 text-right font-mono text-[11px] font-normal tracking-[0.06em] uppercase">
                  Count
                </th>
                <th class="pb-2 text-right font-mono text-[11px] font-normal tracking-[0.06em] uppercase">Share</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data.interest" :key="row.option" class="border-b border-line/60">
                <td class="py-2 pr-4 text-text-dim">{{ row.option }}</td>
                <td class="py-2 pr-4 text-right font-mono tabular-nums">{{ row.count }}</td>
                <td class="py-2 text-right font-mono tabular-nums">{{ pctOf(row.count, interestTotal) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Size chart -->
        <div class="mb-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div class="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h2 class="font-display text-[18px] font-semibold">Which size(s) interest people?</h2>
            <button
              type="button"
              class="cursor-pointer font-mono text-[11px] tracking-[0.06em] text-text-faint uppercase transition-colors duration-150 hover:text-text-dim"
              @click="showSizeTable = !showSizeTable"
            >
              {{ showSizeTable ? 'View chart' : 'View as table' }}
            </button>
          </div>
          <p class="mb-6 text-[12px] text-text-faint">
            Multi-select — respondents could pick more than one, so this can add up to more than
            {{ data.total }} total responses.
          </p>

          <div v-if="!showSizeTable" class="flex flex-col gap-4">
            <div v-for="row in data.sizes" :key="row.option" class="group">
              <div class="mb-1.5 flex items-baseline justify-between gap-3 text-[13.5px]">
                <span class="text-text-dim">{{ row.option }}</span>
                <span class="font-mono text-[12px] text-text-faint">
                  {{ row.count }} · {{ pctOf(row.count, data.total) }}%
                </span>
              </div>
              <div class="h-3 w-full rounded-full bg-surface-2" :title="`${row.option}: ${row.count} picks`">
                <div
                  class="h-3 rounded-full transition-[width] duration-500 ease-out"
                  :style="{ width: `${barWidthPct(row.count, data.sizes)}%`, backgroundColor: SIZE_COLOR }"
                />
              </div>
            </div>
          </div>

          <table v-else class="w-full text-left text-[13.5px]">
            <thead>
              <tr class="border-b border-line text-text-faint">
                <th class="pb-2 pr-4 font-mono text-[11px] font-normal tracking-[0.06em] uppercase">Size</th>
                <th class="pb-2 pr-4 text-right font-mono text-[11px] font-normal tracking-[0.06em] uppercase">
                  Picks
                </th>
                <th class="pb-2 text-right font-mono text-[11px] font-normal tracking-[0.06em] uppercase">
                  Of all responses
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data.sizes" :key="row.option" class="border-b border-line/60">
                <td class="py-2 pr-4 text-text-dim">{{ row.option }}</td>
                <td class="py-2 pr-4 text-right font-mono tabular-nums">{{ row.count }}</td>
                <td class="py-2 text-right font-mono tabular-nums">{{ pctOf(row.count, data.total) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Comments -->
        <div class="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h2 class="mb-6 font-display text-[18px] font-semibold">What people said</h2>
          <div v-if="data.comments.length === 0" class="text-[13.5px] text-text-faint">No comments yet.</div>
          <div v-else class="flex flex-col gap-4">
            <div
              v-for="c in data.comments"
              :key="c.id"
              class="rounded-lg border border-line bg-surface-2 p-4 text-[13.5px] text-text-dim"
            >
              <p class="mb-2 leading-relaxed whitespace-pre-wrap">{{ c.comment }}</p>
              <div class="font-mono text-[11px] text-text-faint">{{ relativeTime(c.createdAt) }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
