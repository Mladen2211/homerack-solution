<script setup lang="ts">
const rackViewer = ref<{
  applyFinish: (key: Finish) => void
  selectVariant: (key: Variant) => void
} | null>(null)

const title = 'Homerack — 10" Server Rack Cabinet for Home Labs | R1 & R.5'
const description =
  'A 10" server rack cabinet built around a riveted aluminium frame with standard EIA-310 mounting — two heights (R1 10U, R.5 5U), three finishes, and a bay sized for 3D-printed rack units.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

defineOgImage('Homerack', {
  title: 'Rack gear, without the rack tax.',
  subtitle: 'A 10" server rack cabinet for home labs — R1 & R.5',
})

useSchemaOrg([
  defineOrganization({
    name: 'Homerack',
    description,
  }),
  defineWebPage({
    name: title,
    description,
  }),
])
</script>

<template>
  <main>
    <HeroSection />

    <section id="viewer" class="mx-auto max-w-[1180px] px-5 py-9.5 pb-17.5 sm:px-8">
      <RackViewer ref="rackViewer" />
    </section>

    <SpecStrip />

    <UsesSection />
    <AttachmentsSection />
    <LifestyleSection @room-change="(finish) => rackViewer?.applyFinish(finish)" />
    <FamilySection />
    <FeedbackSurvey />
  </main>
</template>
