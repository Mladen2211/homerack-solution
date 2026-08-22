<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
  }>(),
  {
    title: 'Homerack',
    subtitle: 'A 10" server rack cabinet for home labs — R1 & R.5',
  },
)
</script>

<template>
  <div
    style="
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 72px;
      background: linear-gradient(150deg, #1b1d24 0%, #14151a 70%);
      color: #edeef2;
      font-family: Inter;
    "
  >
    <div style="display: flex; align-items: center; gap: 12px">
      <div style="width: 16px; height: 16px; border-radius: 4px; background: #e2793a" />
      <div style="font-family: 'Space Grotesk'; font-weight: 700; font-size: 30px; letter-spacing: 0.02em">
        HOMERACK
      </div>
    </div>

    <div style="display: flex; flex-direction: column">
      <div
        style="
          font-family: 'Space Grotesk';
          font-weight: 700;
          font-size: 78px;
          line-height: 1;
          letter-spacing: -0.02em;
          color: #edeef2;
        "
      >
        {{ title }}
      </div>
      <div style="margin-top: 22px; font-size: 28px; color: #9ba0ac; max-width: 900px">
        {{ subtitle }}
      </div>
    </div>

    <div style="display: flex; gap: 28px; font-family: 'Space Grotesk'; font-size: 20px; color: #686d7a">
      <div style="display: flex">312×312mm footprint</div>
      <div style="display: flex">EIA-310 mounting</div>
      <div style="display: flex">R1 / R.5</div>
    </div>
  </div>
</template>
