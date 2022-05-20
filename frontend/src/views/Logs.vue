<template>
  <div class="logs-wrapper" :style="'height: ' + wrapperHeight">
    <div v-if="loading" class="p-d-flex p-jc-center" style="height: 100%">
      <i class="pi pi-spin pi-spinner p-as-center" style="font-size: 2.5rem"></i>
    </div>
    <div v-else style="height: 100%">
      <div ref="buttons" class="p-d-flex p-ai-center p-jc-end p-p-2">
        <Button
          v-if="size"
          type="button"
          :label="size"
          icon="pi pi-trash"
          class="p-mr-2 p-button-sm p-button-danger"
          :disabled="loading || refresh || size.toLowerCase() === '0 bytes'"
          @click="remove"
        />
        <Button
          type="button"
          :icon="loading || refresh ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"
          class="p-button-sm"
          :disabled="loading || refresh"
          @click="get('button')"
        />
      </div>
      <div v-if="logs === ''" class="p-d-flex p-text-center p-jc-center p-ai-center" :style="'height: ' + height">
        <strong>Log file is empty</strong>
      </div>
      <pre v-else-if="height" ref="logs" :style="'height: ' + height">{{ logs }}</pre>
    </div>
  </div>
</template>

<script>
import Button from 'primevue/button';
import ApiService from '@/services/api.service';
import Sleep from '@/util/sleep.util';

export default {
  components: { Button },
  data: () => ({
    loading: false,
    refresh: false,
    logs: null,
    size: null,
    height: null,
    wrapperHeight: null,
  }),
  props: {
    toolbarHeight: Number,
  },
  mounted() {
    this.get();
    this.updateHeight();
    window.addEventListener('resize', this.updateHeight);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateHeight);
  },
  computed: {},
  methods: {
    async get(type) {
      try {
        if (type === 'button') {
          this.refresh = true;
          await Sleep(500);
        } else this.loading = true;
        const { data } = await ApiService.get('logger');
        this.logs = data.logs;
        this.size = data.size;
        this.loading = false;
        this.refresh = false;
        this.$nextTick(() => {
          this.updateHeight();
          const container = this.$refs.logs;
          container.scrollTop = container.scrollHeight;
        });
      } catch (error) {
        this.loading = false;
        this.refresh = false;
        this.emitter.emit('error', error);
      }
    },
    async remove() {
      try {
        this.$confirm.require({
          header: 'Confirmation',
          message: 'Do you want to clear the log file?',
          acceptClass: 'p-button-danger',
          position: 'top',
          accept: async () => {
            try {
              await ApiService.delete('logger');
              await this.get();
            } catch (error) {
              this.emitter.emit('error', error);
            }
          },
        });
      } catch (error) {
        this.emitter.emit('error', error);
      }
    },
    updateHeight() {
      this.height = `${window.innerHeight - this.toolbarHeight - (this.$refs.buttons?.clientHeight || 0)}px`;
      this.wrapperHeight = `${window.innerHeight - this.toolbarHeight}px`;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';
pre {
  font-size: 0.85rem;
  margin: 0;
  background: var(--surface-a);
  padding: 1rem;
  overflow: auto;
}

p {
  margin: 0;
}

@media only screen and (max-width: 576px) {
  h1 {
    font-size: 1.35rem;
  }
}
</style>
