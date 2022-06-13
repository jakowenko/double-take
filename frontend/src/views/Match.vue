<template>
  <div class="match-wrapper" :style="{ paddingTop: headerHeight + filterBarHeight + 'px' }">
    <Header
      type="match"
      :loading="loading"
      :matches="matches"
      :stats="{ current: pagination.total, total: dropdowns.total }"
      :areAllSelected="areAllSelected"
      :dropdowns="dropdowns"
      :toolbarHeight="toolbarHeight"
      :socket="socket"
      ref="header"
    />
    <div
      class="loading-wrapper p-d-flex p-flex-column p-jc-center"
      v-if="showLoading || showNoFiles"
      :style="{ top: headerHeight + toolbarHeight + filterBarHeight + 'px' }"
    >
      <i class="pi pi-spin pi-spinner p-as-center" style="font-size: 2.5rem"></i>
      <div v-if="showNoFiles" class="p-mt-5 p-text-center p-as-center" style="width: 100%">
        <p class="p-text-bold p-mb-3">No files found</p>
        <DataTable class="filter-table p-datatable-sm" :value="filterHelpText()" responsiveLayout="scroll">
          <Column>
            <template v-slot:body="slotProps">
              <strong>{{ slotProps.data.key }}</strong>
            </template>
          </Column>
          <Column>
            <template v-slot:body="slotProps">
              <pre>{{ slotProps.data.value }}</pre>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
    <div class="p-d-flex p-jc-center p-flex-column" :class="isPaginationVisible ? 'pagination-padding' : ''">
      <div id="pull-to-reload-message"></div>

      <Grid type="match" :matches="matches" style="width: 100%" />
    </div>
    <div
      v-if="isPaginationVisible"
      class="pagination p-d-flex p-jc-center"
      :style="{ top: headerHeight + toolbarHeight + filterBarHeight + 'px' }"
    >
      <Pagination :pagination="pagination" :loading="loading" />
    </div>
  </div>
</template>

<script>
import PullToRefresh from 'pulltorefreshjs';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

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
    DataTable,
    Column,
  },
  data: () => ({
    socketEnabled: null,
    pagination: {
      total: 0,
      page: 1,
      temp: 1,
      limit: 0,
    },
    folders: [],
    loading: {
      folders: false,
      files: false,
      createFolder: false,
      filter: false,
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
    headerHeight: 0,
    filterBarHeight: 0,
  }),
  props: {
    toolbarHeight: Number,
    socket: Object,
  },
  computed: {
    showLoading() {
      return this.loading.files && !this.matches.source.length;
    },
    showNoFiles() {
      return !this.loading.files && !this.matches.source.length;
    },
    isPaginationVisible() {
      return this.pagination.total > this.pagination.limit;
    },
    areAllSelected() {
      return (
        this.matches.selected.length > 0 &&
        this.matches.selected.length + this.matches.disabled.length === this.matches.source.length
      );
    },
  },
  async mounted() {
    try {
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

      this.headerHeight = this.$refs.header.getHeight();
      if (this.socket) {
        this.socket.on('recognize', (/* message */) => {
          if (this.socketEnabled) this.get().matches();
        });
      }
      this.get().matches();
    } catch (error) {
      this.emitter.emit('error', error);
    }
  },
  beforeUnmount() {
    const emitters = [
      'updateFilter',
      'trainingFolder',
      'assetLoaded',
      'toggleAsset',
      'reprocess',
      'paginate',
      'updateFilterSettings',
    ];
    emitters.forEach((emitter) => {
      this.emitter.off(emitter);
    });
    PullToRefresh.destroyAll();
  },
  created() {
    this.emitter.on('updateFilterSettings', (obj) => {
      this.updateFilterSettings(obj);
      if ('socket' in obj) {
        this.socketEnabled = obj.socket;
      }
      if ('bar' in obj) {
        this.$nextTick(() => {
          if (obj.bar === true) this.filterBarHeight = this.$refs.header.getSubHeight();
          else this.filterBarHeight = 0;
        });
      }
    });
    this.emitter.on('updateFilter', async () => {
      this.clear(['source', 'selected', 'disabled', 'loaded']);
      await this.get().matches({ filters: false });
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
      this.pagination.temp = value;
      this.clear(['source', 'selected', 'disabled', 'loaded']);
      this.get().matches();
    });
  },
  methods: {
    clear(items) {
      items.forEach((item) => {
        this.matches[item] = [];
      });
    },
    get() {
      const $this = this;
      return {
        async matches(options) {
          try {
            const { filters = true, delay = 0 } = options || {};
            if ($this.loading.files) return;
            $this.loading.files = true;
            await Sleep(delay);

            if (filters) await $this.get().filters();
            $this.filters = $this.$refs?.header?.getFilters() || {};
            const sinceId =
              // eslint-disable-next-line no-nested-ternary
              $this.pagination.temp > 1 ? 0 : $this.matches.source.length ? $this.matches.source[0].id : 0;
            const { data } = await ApiService.get('match', {
              params: { page: $this.pagination.temp, sinceId, filters: $this.filters },
            });
            $this.pagination.limit = data.limit;
            $this.pagination.total = sinceId === 0 ? data.total : $this.pagination.total + data.matches.length;

            if (data.matches.length) {
              $this.pagination.page = $this.pagination.temp;
              if ($this.pagination.page === 1) {
                $this.matches.disabled.forEach((id) => {
                  const index = $this.matches.source.findIndex((obj) => obj.id === id);
                  if (index !== -1) $this.matches.source.splice(index, 1);
                });
                $this.matches.source.unshift(...data.matches);
                $this.matches.source = $this.matches.source.slice(0, data.limit);
              } else if (JSON.stringify($this.matches.source) !== JSON.stringify(data.matches)) {
                $this.clear(['source', 'disabled', 'loaded']);
                $this.matches.source = data.matches;
              }
            }

            $this.loading.files = false;

            if ($this.pagination.temp > 1 && !data.matches.length) {
              $this.pagination.temp -= 1;
              await $this.get().matches({ filters: false });
            }
          } catch (error) {
            $this.loading.files = false;
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
                  await ApiService.delete('match', { data: { ids: $this.matches.selected } });
                  $this.pagination.total -= $this.matches.selected.length;
                  $this.dropdowns.total -= $this.matches.selected.length;
                  const { areAllSelected } = $this;
                  $this.matches.disabled = $this.matches.disabled.concat($this.matches.selected);
                  $this.matches.selected = [];
                  $this.emitter.emit('toast', { message: `${description} deleted` });
                  if (areAllSelected) {
                    $this.clear(['source', 'selected', 'disabled', 'loaded']);
                    await $this.get().matches({ filters: false });
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
    filterHelpText() {
      const filters = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const [key] of Object.entries(this.filters)) {
        // eslint-disable-next-line no-nested-ternary
        const newValue = Array.isArray(this.filters[key])
          ? this.filters[key].length
            ? this.filters[key].join(', ')
            : 'none selected'
          : this.filters[key];
        filters.push({ key, value: newValue });
      }

      return filters;
    },
    updateFilterSettings(value) {
      const settings = JSON.parse(localStorage.getItem('filter-settings')) || {};
      localStorage.setItem('filter-settings', JSON.stringify({ ...settings, ...value }));
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
  z-index: 2;
  background: var(--surface-b);

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

::v-deep(.filter-table) {
  width: 25%;
  min-width: 300px;
  margin: auto;
  font-size: 0.85rem;

  pre {
    margin: 0;
  }

  .p-datatable-table thead {
    display: none;
  }

  .p-datatable-table tr td:first-child {
    width: 30%;
  }
  .p-datatable-table tr td:last-child {
    width: 70%;
  }
}
</style>
