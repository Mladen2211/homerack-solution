import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-18',

  modules: ['@nuxtjs/seo', '@nuxt/fonts', '@vueuse/nuxt'],

  devtools: { enabled: true },

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [{ name: 'google-site-verification', content: 'k7fT2u2rBwuOd7MVOoyNjt00xAamgqOLbWxQ2UBbNfE' }],
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://homerack.mraguz.com',
    name: 'Homerack',
    description:
      'Homerack is a 10" server rack cabinet for home labs — a riveted aluminium frame with standard EIA-310 mounting, in two heights (R1 / R.5), designed so any rack-eared gear fits.',
    defaultLocale: 'en',
  },

  fonts: {
    families: [
      { name: 'Space Grotesk', provider: 'google', weights: [500, 600, 700] },
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 600] },
    ],
  },

  nitro: {
    preset: 'node-server',
  },

  // Overridable at runtime via NUXT_DATABASE_PATH / NUXT_SURVEY_IP_SALT (Nuxt's
  // standard runtimeConfig env convention) — not plain DATABASE_PATH/SURVEY_IP_SALT.
  runtimeConfig: {
    databasePath: './data/homerack.db',
    surveyIpSalt: 'homerack-dev-salt',
  },
})
