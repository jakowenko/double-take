<template>
  <div class="train-wrapper">
    <Header
      type="train"
      :loading="loading"
      :stats="{ filtered: filtered.length, source: source.length }"
      :matches="matches"
      :areAllSelected="areAllSelected"
      :toolbarHeight="toolbarHeight"
      ref="header"
    />
    <div
      class="loading-wrapper p-d-flex p-jc-center"
      v-if="loading.files || loading.status || !matches.source.length"
      :style="{ top: headerHeight + toolbarHeight + 'px' }"
    >
      <i
        v-if="loading.files || (loading.status && !status.length)"
        class="pi pi-spin pi-spinner p-as-center"
        style="font-size: 2.5rem"
      ></i>
      <div v-else-if="loading.status && status.length" class="p-as-center progress-holder">
        <p class="p-mb-3 p-text-bold p-text-center">Training in progress...</p>
        <div v-for="name in status" :key="name" class="p-mb-3">
          <div class="p-mb-1 p-text-bold">{{ name.name }} - {{ name.trained }}/{{ name.total }}</div>
          <ProgressBar :value="name.percent" />
        </div>
      </div>
      <div v-else class="p-text-center p-as-center">
        <p class="p-text-bold p-mb-3">No files found</p>
      </div>
    </div>
    <div v-else class="p-d-flex p-jc-center" :style="{ marginTop: headerHeight + 'px' }">
      <Grid type="train" :folders="folders" :matches="{ filtered, ...matches }" style="width: 100%" />
    </div>
  </div>
</template>

<script>
import ProgressBar from 'primevue/progressbar';
import Grid from '@/components/Grid.vue';
import Sleep from '@/util/sleep.util';
import ApiService from '@/services/api.service';
import Header from '@/components/Header.vue';

export default {
  components: {
    Grid,
    Header,
    ProgressBar,
  },
  data: () => ({
    loading: {
      files: true,
      status: true,
    },
    folders: [],
    status: [],
    matches: {
      source: [],
      selected: [],
      disabled: [],
      loaded: [],
    },
    trainingFolder: null,
    headerHeight: 0,
  }),
  props: {
    toolbarHeight: Number,
  },
  computed: {
    areAllSelected() {
      return this.filtered.length > 0 && this.matches.selected.length === this.filtered.length;
    },
    source() {
      return JSON.parse(JSON.stringify(this.matches.source)).filter((obj) => obj);
    },
    filtered() {
      return JSON.parse(JSON.stringify(this.matches.source)).filter((obj) => obj);
    },
  },
  created() {
    this.emitter.on('trainingFolder', (value) => {
      let shouldRefresh = false;
      if (value !== 'add new' && value !== null) shouldRefresh = true;
      if (value === null && this.trainingFolder !== 'add new') shouldRefresh = true;
      this.trainingFolder = value;
      if (shouldRefresh) this.get().status();
    });

    this.emitter.on('folders', (value) => {
      this.folders = value;
    });

    this.emitter.on('clearSelected', () => {
      this.matches.selected = [];
    });
    this.emitter.on('realoadTrain', (...args) => this.init(...args));
    this.emitter.on('toggleAsset', (...args) => this.selected(...args));
    this.emitter.on('assetLoaded', (...args) => this.assetLoaded(...args));
  },
  async mounted() {
    this.headerHeight = this.$refs.header.getHeight();
    await this.init();
  },
  watch: {},
  methods: {
    async init() {
      const promises = [];
      this.status = [];
      this.matches.selected = [];
      promises.push(this.get().status());
      await Promise.all(promises);
    },
    get() {
      const $this = this;
      return {
        async files() {
          try {
            $this.loading.files = true;
            const { data } = $this.trainingFolder
              ? await ApiService.get(`train?name=${$this.trainingFolder}`)
              : await ApiService.get('train');
            $this.matches.source = data;
            $this.loading.files = false;
          } catch (error) {
            $this.emitter.emit('error', error);
          }
        },
        async status() {
          try {
            $this.loading.status = true;
            await Sleep(1000);
            const { data } = await ApiService.get('train/status');
            $this.status = data.filter((obj) => obj.percent < 100);

            let isComplete = true;
            data.forEach(({ percent }) => {
              if (percent !== 100) isComplete = false;
            });
            if (isComplete) {
              $this.loading.status = false;
              $this.get().files();
            } else {
              $this.get().status();
            }
          } catch (error) {
            $this.emitter.emit('error', error);
          }
        },
      };
    },
    remove() {
      const $this = this;
      return {
        async files() {
          try {
            const trained = $this.matches.selected
              .map((id) => $this.matches.source.find((obj) => obj.id === id))
              .filter((obj) => obj.results.filter(({ result }) => result.status.toString().charAt(0) === '2').length);

            const untrained = $this.matches.selected
              .map((id) => $this.matches.source.find((obj) => obj.id === id))
              .filter(
                (obj) =>
                  trained.findIndex((item) => item.id === obj.id) === -1 &&
                  (!obj.results.length ||
                    obj.results.filter(({ result }) => result.status.toString().charAt(0) !== '2').length),
              );

            const names = [...new Set(trained.map((obj) => obj.name))];
            let message = '';
            if (trained.length) {
              message = `Do you want to untrain ${trained.length} ${
                trained.length === 1 ? 'file' : 'files'
              } from ${names.join(' and ')}`;
            }
            if (trained.length && untrained.length) {
              message += ` and remove ${untrained.length} untrained ${untrained.length === 1 ? 'file' : 'files'}?`;
            } else if (!trained.length && untrained.length) {
              message += `Do you want to remove ${untrained.length} untrained ${
                untrained.length === 1 ? 'file' : 'files'
              }?`;
            }

            $this.$confirm.require({
              header: 'Confirmation',
              message,
              acceptClass: 'p-button-danger',
              position: 'top',
              accept: async () => {
                try {
                  names.forEach((name) => {
                    ApiService.delete(`train/remove/${name}`, { data: $this.matches.selected });
                  });
                  if (untrained.length) {
                    await ApiService.delete('storage/train', {
                      data: {
                        files: untrained.map((obj) => ({ id: obj.id, key: obj.file.key })),
                      },
                    });
                  }
                  await $this.init();
                } catch (error) {
                  $this.emitter.emit('error', error);
                }
              },
            });
          } catch (error) {
            $this.emitter.emit('error', error);
          }
        },
      };
    },
    untrain() {
      this.emitter.emit('clearSelected');
      const $this = this;
      this.$confirm.require({
        header: 'Confirmation',
        message: `Do you want to untrain all images for ${this.trainingFolder}?`,
        acceptClass: 'p-button-danger',
        position: 'top',
        accept: async () => {
          try {
            await ApiService.delete(`train/remove/${this.trainingFolder}`);
            await $this.init();
          } catch (error) {
            $this.emitter.emit('error', error);
          }
        },
      });
    },
    sync() {
      this.emitter.emit('clearSelected');
      const $this = this;
      this.$confirm.require({
        header: 'Confirmation',
        message: `Do you want to sync all images for ${this.trainingFolder}? This will untrain and retrain all images for the configured detectors.`,
        acceptClass: 'p-button-success',
        position: 'top',
        accept: async () => {
          try {
            await ApiService.get(`train/retrain/${this.trainingFolder}`);
            await $this.init();
          } catch (error) {
            $this.emitter.emit('error', error);
          }
        },
      });
    },
    assetLoaded(id) {
      this.matches.loaded.push(id);
    },
    selected(asset) {
      const { id } = asset;
      if (this.matches.disabled.includes(id)) return;
      const index = this.matches.selected.indexOf(id);
      if (index !== -1) this.matches.selected.splice(index, 1);
      else this.matches.selected.unshift(id);
    },
    toggleAll(state) {
      const available = this.matches.source
        .filter((obj) => !this.matches.disabled.includes(obj.id))
        .map((obj) => obj.id);
      this.matches.selected = state ? available : [];
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';

.loading-wrapper {
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;

  p {
    margin: 0;
  }
}

.fixed {
  position: fixed;
  top: $tool-bar-height;
  z-index: 5;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  background: var(--surface-a);
  max-width: $max-width;

  .name {
    text-align: center;
    white-space: nowrap;
    font-size: 0.9rem;
    @media only screen and (max-width: 576px) {
      font-size: 0.75rem !important;
    }
  }
  .status {
    font-size: 0.8rem;
    @media only screen and (max-width: 576px) {
      font-size: 0.65rem !important;
    }
  }
}

.progress-holder {
  width: 30%;
  @media only screen and (max-width: 576px) {
    width: 70%;
  }
}
</style>
