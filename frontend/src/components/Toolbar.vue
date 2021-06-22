<template>
  <div class="wrapper p-text-right p-pr-3 p-d-flex p-ai-center p-jc-end">v{{ version }}</div>
</template>

<script>
import ApiService from '@/services/api.service';

export default {
  data: () => ({
    version: null,
  }),
  async mounted() {
    try {
      const { data } = await ApiService.get('config');
      this.version = data.version;
      // eslint-disable-next-line no-empty
    } catch (error) {}
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';
.wrapper {
  height: 20px;
  font-size: 11px;
  z-index: 5;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: $max-width;
  background: var(--surface-b);
}
</style>
