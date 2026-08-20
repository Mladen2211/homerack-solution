<script setup lang="ts">
const interest = ref<string | null>(null)
const sizes = ref<string[]>([])
const comment = ref('')
const honeypot = ref('') // hidden field — real visitors never fill this in

const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

function toggleSize(value: string) {
  const idx = sizes.value.indexOf(value)
  if (idx > -1) sizes.value.splice(idx, 1)
  else sizes.value.push(value)
}

async function submit() {
  error.value = ''
  const trimmedComment = comment.value.trim()
  if (!interest.value && sizes.value.length === 0 && !trimmedComment) {
    error.value = 'Pick at least one answer, or leave a comment, before sending.'
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/survey', {
      method: 'POST',
      body: {
        interest: interest.value,
        sizes: sizes.value,
        comment: trimmedComment,
        honeypot: honeypot.value,
      },
    })
    submitted.value = true
  } catch (e: any) {
    console.error('[survey] submit failed', e)
    const status = e?.statusCode ?? e?.status ?? e?.response?.status
    error.value =
      status === 429
        ? "You've sent a few of these recently — try again in a bit."
        : "Couldn't save your response right now — feel free to try again in a moment."
  } finally {
    submitting.value = false
  }
}

const { target, isVisible, style } = useScrollReveal()
</script>

<template>
  <section id="feedback" class="py-13 sm:py-20">
    <div class="mx-auto max-w-[1180px] px-5 sm:px-8">
      <div class="mb-11 max-w-[560px]">
        <div class="mb-3 font-mono text-[11.5px] tracking-[0.1em] text-blue uppercase">Tell us</div>
        <h2 class="mb-3 font-display text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.01em]">
          Would this be worth building?
        </h2>
        <p class="max-w-[520px] text-[15.5px] text-text-dim">
          This is still a concept. If you'd actually want one, or you'd want it different, this
          is genuinely useful to know before anything gets fabricated.
        </p>
      </div>

      <div
        :ref="(el) => (target = el as HTMLElement | null)"
        class="reveal rounded-2xl border border-line bg-surface p-6 sm:p-11"
        :class="{ 'reveal-visible': isVisible }"
        :style="style"
      >
        <div v-if="!submitted">
          <h3 class="mb-2 font-display text-[22px] font-semibold">Quick survey — three questions</h3>
          <p class="mb-7.5 max-w-[520px] text-sm text-text-dim">
            No account, no email required. Takes about 20 seconds.
          </p>

          <!-- honeypot — hidden from real visitors, invisible to screen readers. Field
               name deliberately avoids "website"/"email"/"name" etc — those are
               recognized browser autofill tokens and a real visitor's autofill
               dropping an address into a field named "website" would trip this. -->
          <div class="absolute left-[-9999px]" aria-hidden="true">
            <label for="hp-note">Leave this field blank</label>
            <input id="hp-note" v-model="honeypot" type="text" tabindex="-1" autocomplete="off" />
          </div>

          <div class="mb-6.5">
            <div class="mb-3 font-mono text-[11px] tracking-[0.06em] text-text-faint uppercase">
              Would you be interested in buying a Homerack?
            </div>
            <div class="flex flex-wrap gap-2.5">
              <button
                v-for="opt in INTEREST_OPTIONS"
                :key="opt"
                type="button"
                class="cursor-pointer rounded-lg border px-4 py-2.5 text-[13.5px] transition-all duration-150"
                :class="
                  interest === opt
                    ? 'border-blue bg-blue text-white'
                    : 'border-line bg-surface-2 text-text-dim hover:border-[#3a3f4c]'
                "
                @click="interest = opt"
              >
                {{ opt }}
              </button>
            </div>
          </div>

          <div class="mb-6.5">
            <div class="mb-3 font-mono text-[11px] tracking-[0.06em] text-text-faint uppercase">
              Which size(s) interest you? (pick any)
            </div>
            <div class="flex flex-wrap gap-2.5">
              <button
                v-for="opt in SIZE_OPTIONS"
                :key="opt"
                type="button"
                class="cursor-pointer rounded-lg border px-4 py-2.5 text-[13.5px] transition-all duration-150"
                :class="
                  sizes.includes(opt)
                    ? 'border-blue bg-blue text-white'
                    : 'border-line bg-surface-2 text-text-dim hover:border-[#3a3f4c]'
                "
                @click="toggleSize(opt)"
              >
                {{ opt }}
              </button>
            </div>
          </div>

          <div class="mb-6.5">
            <div class="mb-3 font-mono text-[11px] tracking-[0.06em] text-text-faint uppercase">
              What would you change, or what would make this better?
            </div>
            <textarea
              v-model="comment"
              maxlength="2000"
              placeholder="What don't you like about this concept? What would you love to see?"
              class="min-h-[90px] w-full resize-y rounded-lg border border-line bg-surface-2 px-3.5 py-3 text-[13.5px] text-text focus:border-blue focus:outline-none"
            />
          </div>

          <button
            :disabled="submitting"
            class="mt-2 rounded-lg bg-amber px-6.5 py-3 font-display text-sm font-semibold text-[#1a1005] transition-opacity duration-150 hover:opacity-88 disabled:cursor-default disabled:opacity-50"
            @click="submit"
          >
            {{ submitting ? 'Sending…' : 'Send feedback' }}
          </button>
          <div v-if="error" class="mt-3 max-w-[520px] text-[11.5px] leading-relaxed text-[#c9524a]">
            {{ error }}
          </div>
          <div class="mt-3 max-w-[520px] text-[11.5px] leading-relaxed text-text-faint">
            Responses are stored so the project can be shaped around actual interest — this is a
            small, informal concept survey, not a purchase commitment of any kind.
          </div>
        </div>

        <div v-else class="animate-fade-in py-7.5 text-center">
          <h3 class="mb-2 font-display text-[22px] font-semibold">Thanks — that's genuinely useful.</h3>
          <p class="mx-auto text-sm text-text-dim">Your response has been recorded.</p>
        </div>
      </div>
    </div>
  </section>
</template>
