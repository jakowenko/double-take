<template>
  <div class="train-wrapper" :style="{ paddingTop: headerHeight + 'px' }">
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
      class="loading-wrapper p-d-flex p-flex-column p-jc-center"
      v-if="showLoading"
      :style="{ top: headerHeight + toolbarHeight + 'px' }"
    >
      <i v-if="loading.files || loading.status" class="pi pi-spin pi-spinner p-as-center" style="font-size: 2.5rem"></i>
      <div v-if="loading.status && status.length" class="p-mt-5 p-as-center progress-holder">
        <p class="p-mb-3 p-text-bold p-text-center">Training...</p>
        <div v-for="name in status" :key="name" class="p-mb-3">
          <div class="p-mb-1 p-text-bold">{{ name.name }} - {{ name.trained }}/{{ name.total }}</div>
          <ProgressBar :value="name.percent" />
        </div>
      </div>
      <div v-if="!loading.status && !loading.files && !matches.source.length" class="p-text-center p-as-center">
        <p class="p-text-bold p-mb-3">No files found</p>
      </div>
    </div>
    <div class="p-d-flex p-jc-center p-flex-column" :class="isPaginationVisible ? 'pagination-padding' : ''">
      <div id="pull-to-reload-message"></div>
      <Grid type="train" :folders="folders" :matches="{ filtered, ...matches }" style="width: 100%" />
    </div>
    <div
      v-if="isPaginationVisible"
      class="pagination p-d-flex p-jc-center"
      :style="{ top: headerHeight + toolbarHeight + 'px' }"
    >
      <Pagination :pagination="pagination" :loading="loading" />
    </div>
  </div>
</template>

<script>
import PullToRefresh from 'pulltorefreshjs';

import ProgressBar from 'primevue/progressbar';

import Grid from '@/components/Grid.vue';
import Sleep from '@/util/sleep.util';
import ApiService from '@/services/api.service';
import Header from '@/components/Header.vue';
import Pagination from '@/components/Pagination.vue';

export default {
  components: {
    Grid,
    Header,
    ProgressBar,
    Pagination,
  },
  data: () => ({
    pagination: {
      total: 0,
      page: 1,
      temp: 1,
      limit: 0,
    },
    loading: {
      files: false,
      status: false,
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
    showLoading() {
      return this.loading.files || this.loading.status || !this.matches.source.length;
    },
    isPaginationVisible() {
      return !this.loading.status && this.pagination.total > this.pagination.limit;
    },
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
      if (shouldRefresh) {
        this.clear(['source', 'selected', 'disabled', 'loaded']);
        this.pagination.temp = 1;
        this.get().files();
      }
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

    this.emitter.on('paginate', (value) => {
      this.pagination.temp = value;
      this.clear(['source', 'selected', 'disabled', 'loaded']);
      this.get().files();
    });
  },
  beforeUnmount() {
    const emitters = [
      'trainingFolder',
      'folders',
      'clearSelected',
      'realoadTrain',
      'toggleAsset',
      'assetLoaded',
      'paginate',
    ];
    emitters.forEach((emitter) => {
      this.emitter.off(emitter);
    });
    PullToRefresh.destroyAll();
  },
  async mounted() {
    this.headerHeight = this.$refs.header.getHeight();
    this.init();
    PullToRefresh.init({
      mainElement: '#pull-to-reload-message',
      triggerElement: '#app-wrapper',
      distMax: 50,
      distThreshold: 45,
      onRefresh() {
        window.location.reload();
      },
      shouldPullToRefresh() {
        return window.scrollY === 0;
      },
    });
  },
  watch: {},
  methods: {
    async init() {
      this.clear(['source', 'selected', 'disabled', 'loaded']);
      const promises = [];
      promises.push(this.get().status());
      await Promise.all(promises);
    },
    clear(items) {
      items.forEach((item) => {
        this.matches[item] = [];
      });
    },
    get() {
      const $this = this;
      return {
        async files(isRefresh = false) {
          try {
            if ($this.loading.status) return;
            $this.loading.files = !isRefresh;
            const { data } = $this.trainingFolder
              ? await ApiService.get(`train?name=${$this.trainingFolder}`, { params: { page: $this.pagination.temp } })
              : await ApiService.get('train', { params: { page: $this.pagination.temp } });
            $this.matches.source = data.files;
            $this.pagination.limit = data.limit;
            $this.pagination.total = data.total;

            if (data.files.length) $this.pagination.page = $this.pagination.temp;

            if ($this.pagination.temp > 1 && !data.files.length) {
              $this.pagination.temp -= 1;
              await $this.get().files();
              return;
            }

            $this.loading.files = false;
          } catch (error) {
            $this.emitter.emit('error', error);
          }
        },
        async status() {
          try {
            $this.loading.status = true;
            await Sleep(250);
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
              .filter(
                (obj) =>
                  obj.results.filter(
                    ({ result }) =>
                      result?.status?.toString().charAt(0) === '2' ||
                      result?.$metadata?.httpStatusCode?.toString().charAt(0) === '2',
                  ).length,
              );

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
                  const { selected } = $this.matches;
                  $this.loading.files = true;
                  $this.clear(['source', 'selected', 'disabled', 'loaded']);
                  for (const name of names) {
                    await ApiService.delete(`train/remove/${name}`, { data: selected });
                  }
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
  z-index: 3;

  p {
    margin: 0;
  }
}

.pagination {
  position: fixed;
  left: 300px;
  top: 100px;
  z-index: 2;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: $max-width;
  padding: 0.5rem 0;
  background: var(--surface-b);
}

.pagination-padding {
  padding-top: 2rem;
}

.progress-holder {
  width: 30%;
  min-width: 300px;
  @media only screen and (max-width: 576px) {
    width: 70%;
  }
}
</style>
