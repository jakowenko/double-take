<template>
  <div class="wrapper">
    <div class="p-d-flex p-jc-center p-p-3">
      <i v-if="loading && !files.length" class="pi pi-spin pi-spinner p-mt-5" style="font-size: 3rem"></i>
      <Grid v-else type="train" :files="files" style="width: 100%" />
    </div>
  </div>
</template>

<script>
import Grid from '@/components/match/Grid.vue';
import Sleep from '@/util/sleep.util';
import ApiService from '@/services/api.service';

export default {
  components: {
    Grid,
  },
  data: () => ({
    loading: false,
    files: [],
  }),
  computed: {
    names() {
      const names = this.files.map((obj) => obj.name);
      return [...new Set(names)];
    },
    detectors() {
      const detectors = this.files.map((obj) => obj.detector);
      return [...new Set(detectors)];
    },
  },
  async mounted() {
    try {
      this.loading = true;
      await Sleep(1000);
      const { data } = await ApiService.get('/train');
      this.files = data;
      this.loading = false;
    } catch (error) {
      this.$toast.add({
        severity: 'error',
        detail: error.message,
        life: 3000,
      });
    }
  },
};
</script>

<style scoped lang="scss"></style>
