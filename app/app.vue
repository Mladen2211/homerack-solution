<script setup lang="ts">
// Google Tag Manager — environment 2 (non-Live), per the id/env/auth given for this
// deploy. Swap the gtm.js src host to a self-hosted server-container domain later if/
// when the server-side tagging server (per Google's server-side setup guide) is live;
// until then this loads straight from Google's own googletagmanager.com.
useHead({
  script: [
    {
      key: 'gtm-head',
      innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl+'&gtm_auth=eZ8ocauCdDa5ajYvGQKNow&gtm_preview=env-2&gtm_cookies_win=x';f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TS7ZF7X6');`,
    },
  ],
  noscript: [
    {
      key: 'gtm-body',
      tagPosition: 'bodyOpen',
      innerHTML:
        '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TS7ZF7X6&gtm_auth=eZ8ocauCdDa5ajYvGQKNow&gtm_preview=env-2&gtm_cookies_win=x" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
    },
  ],
})
</script>

<template>
  <div>
    <NavBar />
    <NuxtPage />
    <SiteFooter />
  </div>
</template>
