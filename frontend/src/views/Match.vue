<template>
  <div class="match-wrapper">
    <Header
      type="match"
      :loading="loading"
      :matches="matches"
      :stats="{ current: pagination.total, total: dropdowns.total }"
      :areAllSelected="areAllSelected"
      :dropdowns="dropdowns"
      :toolbarHeight="toolbarHeight"
      ref="header"
    />
    <div
      class="loading-wrapper p-d-flex p-jc-center"
      v-if="showLoading()"
      :style="{ top: headerHeight + toolbarHeight + 'px' }"
    >
      <i
        v-if="(liveReload && !matches.source.length) || (!liveReload && loading.files)"
        class="pi pi-spin pi-spinner p-as-center"
        style="font-size: 2.5rem"
      ></i>
      <div v-else class="p-text-center p-as-center">
        <p class="p-text-bold p-mb-3">No files found</p>
        <div v-for="(filter, index) in filterHelpText()" :key="filter">
          <p :class="index === 0 ? '' : 'p-mt-1'" v-html="filter"></p>
        </div>
      </div>
    </div>
    <div v-else :style="{ marginTop: headerHeight + 'px' }">
      <div v-if="matches.source.length && !liveReload" class="p-d-flex p-jc-center">
        <Pagination :pagination="pagination" location="top" />
      </div>
      <div class="p-d-flex p-jc-center">
        <Grid type="match" :matches="matches" style="width: 100%" />
      </div>
    </div>
    <div v-if="matches.source.length && !liveReload" class="p-d-flex p-jc-center">
      <Pagination :pagination="pagination" location="bottom" />
    </div>
  </div>
</template>

<script>
import ApiService from '@/services/api.service';
import Grid from '@/components/Grid.vue';
import Header from '@/components/Header.vue';
import Pagination from '@/components/Pagination.vue';
import Sleep from '@/util/sleep.util';

export default {
  components: {
    Header,
    Grid,
    Pagination,
  },
  data: () => ({
    height: {
      header: 0,
      subheader: 0,
      pagination: 0,
    },
    pagination: {
      total: 0,
      page: 1,
      limit: 0,
    },
    info: null,
    folders: [],
    loading: {
      folders: true,
      files: true,
      createFolder: false,
    },
    matches: {
      source: [],
      selected: [],
      disabled: [],
      loaded: [],
    },
    dropdowns: {},
    filters: {},
    trainingFolder: null,
    liveReload: false,
    headerHeight: 0,
  }),
  props: {
    toolbarHeight: Number,
  },
  computed: {
    areAllSelected() {
      return (
        this.matches.selected.length > 0 &&
        this.matches.selected.length + this.matches.disabled.length === this.matches.source.length
      );
    },
  },
  async mounted() {
    try {
      this.headerHeight = this.$refs.header.getHeight();
      await this.get().matches();
    } catch (error) {
      this.emitter.emit('error', error);
    }
  },
  created() {
    this.emitter.on('liveReload', (value) => {
      this.pagination.page = 1;
      this.liveReload = value;
    });
    this.emitter.on('update', () => {
      this.get().matches(true);
    });
    this.emitter.on('trainingFolder', (value) => {
      this.trainingFolder = value;
    });
    this.emitter.on('assetLoaded', (...args) => this.assetLoaded(...args));
    this.emitter.on('toggleAsset', (...args) => this.selected(...args));
    this.emitter.on('reprocess', (data) => {
      const index = this.matches.source.findIndex((obj) => obj.id === data.id);
      if (index !== -1) this.matches.source[index] = data;
    });
    this.emitter.on('paginate', (value) => {
      this.pagination.page = value;
      this.get().matches(true);
    });
  },
  methods: {
    get() {
      const $this = this;
      return {
        async matches() {
          try {
            $this.loading.files = true;
            if (!$this.liveReload) {
              $this.matches.source = [];
              $this.matches.loaded = [];
            }
            await Sleep(1000);
            await $this.get().filters();
            $this.filters = $this.$refs.header.getFilters();
            const sinceId = $this.matches.source.length && $this.liveReload ? $this.matches.source[0].id : 0;
            const { data } = await ApiService.get('match', {
              params: { page: $this.pagination.page, sinceId, filters: $this.filters },
            });
            $this.pagination.limit = data.limit;
            $this.pagination.total = sinceId === 0 ? data.total : $this.pagination.total + data.matches.length;

            if ($this.liveReload && data.matches.length) {
              $this.matches.source.unshift(...data.matches);
              $this.matches.source = $this.matches.source.slice(0, data.limit);
            }

            if (!$this.liveReload) {
              $this.matches.source = data.matches;
            }

            $this.loading.files = false;
          } catch (error) {
            $this.emitter.emit('error', error);
          }
        },
        async filters() {
          try {
            const { data } = await ApiService.get('match/filters');
            $this.dropdowns = data;
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
            const description = `${$this.matches.selected.length} ${
              $this.matches.selected.length > 1 ? 'files' : 'file'
            }`;
            $this.$confirm.require({
              header: 'Confirmation',
              message: `Do you want to delete ${description}?`,
              acceptClass: 'p-button-danger',
              position: 'top',
              accept: async () => {
                try {
                  await ApiService.delete('match', { data: $this.matches.selected });
                  const { areAllSelected } = $this;
                  $this.matches.disabled = $this.matches.disabled.concat($this.matches.selected);
                  $this.matches.selected = [];
                  $this.emitter.emit('toast', { message: `${description} deleted` });

                  if (areAllSelected && !$this.liveReload) {
                    await $this.get().matches();
                  }
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
    train() {
      const $this = this;
      const description = `${this.matches.selected.length} ${this.matches.selected.length > 1 ? 'files' : 'file'}`;
      this.$confirm.require({
        header: 'Confirmation',
        message: `Do you want to train ${description} for ${this.trainingFolder}?`,
        acceptClass: 'p-button-success',
        position: 'top',
        accept: async () => {
          try {
            await ApiService.post(`train/add/${this.trainingFolder}`, {
              ids: $this.matches.selected,
            });
            $this.matches.selected.forEach((id) => {
              const index = $this.matches.source.findIndex((obj) => obj.id === id);
              if (index !== -1) $this.matches.source[index].isTrained = true;
            });
            $this.matches.selected = [];
            $this.emitter.emit('toast', { message: `${description} trained for ${this.trainingFolder}` });
          } catch (error) {
            $this.emitter.emit('error', error);
          }
        },
      });
    },
    selected(match) {
      const { id } = match;
      if (this.matches.disabled.includes(id)) return;
      const index = this.matches.selected.indexOf(id);
      if (index !== -1) this.matches.selected.splice(index, 1);
      else this.matches.selected.unshift(id);
    },
    assetLoaded(id) {
      this.matches.loaded.push(id);
    },
    toggleAll(state) {
      const available = this.matches.source
        .filter((obj) => !this.matches.disabled.includes(obj.id))
        .map((obj) => obj.id);
      this.matches.selected = state ? available : [];
    },
    showLoading() {
      if (this.liveReload) {
        if (!this.matches.source.length) return true;
      } else {
        if (this.loading.files) return true;
        if (!this.matches.source.length) return true;
      }
      return false;
    },
    filterHelpText() {
      const filters = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const [filter] of Object.entries(this.filters)) {
        filters.push(
          `<strong>${filter}</strong>: ${
            // eslint-disable-next-line no-nested-ternary
            Array.isArray(this.filters[filter])
              ? this.filters[filter].length
                ? this.filters[filter].join(', ')
                : 'none selected'
              : this.filters[filter]
          }`,
        );
      }

      return filters;
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
  background: transparent;
  // display: none;

  p {
    margin: 0;
  }
}
</style>
