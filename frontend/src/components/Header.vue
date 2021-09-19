<template>
  <div class="header-wrapper p-shadow-5 p-pl-3 p-pr-3" ref="header" :style="{ top: toolbarHeight + 'px' }">
    <div v-if="createFolder.show" class="p-d-inline-flex p-ai-center">
      <div class="p-mr-2">
        <InputText type="text" v-model="createFolder.name" @keyup.enter="create().folder()" placeholder="folder name" />
      </div>
      <div>
        <Button
          icon="pi pi-check"
          class="responsive-button p-button-success p-button-sm"
          label="Create"
          @click="create().folder()"
          :disabled="!createFolder.name"
        />
      </div>
      <div class="p-mr-2">
        <Button label="Cancel" class="p-button-text p-button-sm p-ml-2" @click="createFolder.show = false" />
      </div>
    </div>
    <div v-else class="p-d-flex p-jc-between">
      <div class="p-d-inline-flex p-ai-center">
        <div class="p-mr-2">
          <Dropdown
            v-model="folder"
            :options="folders"
            :disabled="createFolder.loading"
            :showClear="true"
            :class="{ train: type === 'train' }"
          />
        </div>
        <div v-if="folder">
          <div v-if="type === 'match'">
            <Button
              class="responsive-button p-button-success p-button-sm"
              icon="pi pi-check"
              label="Train"
              :disabled="matches.selected.length === 0 || !folder"
              @click="$parent.train"
            />
          </div>
          <div v-if="type === 'train' && !loading.files && !loading.status">
            <div class="p-d-inline-block">
              <FileUpload
                mode="basic"
                name="files[]"
                :url="uploadUrl"
                accept="image/*"
                :maxFileSize="10000000"
                @upload="$parent.init()"
                :auto="true"
                :multiple="true"
                chooseLabel="Upload"
                :disabled="loading.files || loading.status"
              />
            </div>
            <Button
              icon="fa fa-recycle push-top"
              class="responsive-button p-button-success p-button-sm p-ml-1"
              @click="$parent.sync"
              label="Sync"
              :disabled="!matches.source.filter((obj) => obj.name === folder).length"
            />
            <Button
              class="responsive-button p-button-danger p-button-sm p-ml-1"
              icon="pi pi-trash"
              :label="
                matches.source.filter((obj) => obj.name === folder && obj.results.length).length ? 'Untrain' : 'Remove'
              "
              @click="
                matches.source.filter((obj) => obj.name === folder && obj.results.length).length
                  ? $parent.untrain()
                  : remove().folder()
              "
            />
          </div>
        </div>
      </div>
      <div class="p-d-inline-flex p-ai-center">
        <div>
          <Button
            v-if="type === 'match'"
            icon="pi pi-trash"
            class="p-button-danger p-button-sm p-mr-1"
            @click="$parent.remove().files($event)"
            :disabled="matches.selected.length === 0"
          />
          <Button
            v-else-if="type === 'train'"
            icon="pi pi-trash"
            class="p-button-danger p-button-sm p-mr-1"
            @click="$parent.remove().files($event)"
            :disabled="matches.selected.length === 0"
          />

          <Button
            :icon="loading.files || loading.status ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"
            class="p-button p-button-sm p-mr-1 reload-btn"
            @click="refresh"
            :disabled="liveReload || loading.files || loading.status"
          />
          <Button
            :icon="areAllSelected ? 'fa fa-check-square' : 'far fa-check-square'"
            class="p-button p-button-sm"
            @click="$parent.toggleAll(!areAllSelected)"
            :disabled="(loading.files && !liveReload) || loading.status"
          />
          <Button
            v-if="type === 'match'"
            icon="pi pi-cog"
            class="p-button p-button-sm p-ml-1"
            @click="showFilter = !showFilter"
          />
        </div>
      </div>
    </div>
    <div v-if="type === 'match'" class="fixed-sub p-pl-3 p-pr-3" :class="{ show: showFilter }">
      <div class="p-grid p-ai-center">
        <div class="p-col-6 p-pb-0 stats-text">{{ stats.current }} of {{ stats.total }}</div>
        <div class="p-col-6 p-d-flex p-jc-end p-pb-0">
          <div class="p-field-checkbox p-mb-0">
            <label for="liveReload" class="p-mr-1">Live Reload</label>
            <Checkbox id="liveReload" v-model="liveReload" :binary="true" />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Filter by name:</label>
            <MultiSelect v-model="selected.names" :options="dropdowns.names" v-on:change="emitter.emit('update')">
              <template v-slot:value="slotProps">
                <div v-for="(option, index) of slotProps.value" :key="option" class="p-d-inline-flex p-mr-1">
                  <div>{{ option + addComma(slotProps.value.length, index) }}</div>
                </div>
              </template>
              <template v-slot:option="slotProps">
                <div>{{ slotProps.option }}</div>
              </template>
            </MultiSelect>
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Filter by match:</label>
            <MultiSelect v-model="selected.matches" :options="dropdowns.matches" v-on:change="emitter.emit('update')">
              <template v-slot:value="slotProps">
                <div v-for="(option, index) of slotProps.value" :key="option" class="p-d-inline-flex p-mr-1">
                  <div>{{ option + addComma(slotProps.value.length, index) }}</div>
                </div>
              </template>
              <template v-slot:option="slotProps">
                <div>{{ slotProps.option }}</div>
              </template>
            </MultiSelect>
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Filter by detector:</label>
            <MultiSelect
              v-model="selected.detectors"
              :options="dropdowns.detectors"
              v-on:change="emitter.emit('update')"
            >
              <template v-slot:value="slotProps">
                <div v-for="(option, index) of slotProps.value" :key="option" class="p-d-inline-flex p-mr-1">
                  <div>{{ option + addComma(slotProps.value.length, index) }}</div>
                </div>
              </template>
              <template v-slot:option="slotProps">
                <div>{{ slotProps.option }}</div>
              </template>
            </MultiSelect>
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Min confidence (%):</label>
            <InputText
              v-model="filters.confidence"
              type="number"
              @input="
                $event.target.value =
                  $event.target.value > 100
                    ? 100
                    : $event.target.value < 0 || $event.target.value === ''
                    ? 0
                    : $event.target.value;
                filters.confidence = $event.target.value === '' ? 0 : parseFloat($event.target.value);
                emitter.emit('update');
              "
            />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Min box width (px):</label>
            <InputText
              v-model="filters.width"
              type="number"
              @input="
                $event.target.value = $event.target.value < 0 || $event.target.value === '' ? 0 : $event.target.value;
                filters.width = $event.target.value === '' ? 0 : parseFloat($event.target.value);
                emitter.emit('update');
              "
            />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Min box height (px):</label>
            <InputText
              v-model="filters.height"
              type="number"
              @input="
                $event.target.value = $event.target.value < 0 || $event.target.value === '' ? 0 : $event.target.value;
                filters.height = $event.target.value === '' ? 0 : parseFloat($event.target.value);
                emitter.emit('update');
              "
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FileUpload from 'primevue/fileupload';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Checkbox from 'primevue/checkbox';

import Constants from '@/util/constants.util';
import ApiService from '@/services/api.service';
import Sleep from '@/util/sleep.util';

export default {
  components: {
    Button,
    Dropdown,
    InputText,
    MultiSelect,
    Checkbox,
    FileUpload,
  },
  data: () => ({
    headerHeight: 0,
    pagination: {
      page: 1,
      total: 0,
    },
    createFolder: {
      name: null,
      show: false,
      loading: false,
    },
    folder: null,
    folders: [],
    liveReload: null,
    showFilter: false,
    filters: {
      names: [],
      matches: [],
      detectors: [],
      confidence: 0,
      width: 0,
      height: 0,
    },
    selected: {},
  }),
  props: {
    areAllSelected: Boolean,
    dropdowns: Object,
    stats: Object,
    matches: Object,
    loading: Object,
    type: String,
    toolbarHeight: Number,
  },
  created() {
    this.emitter.on('setFilters', (value) => {
      this.filters.confidence = value.confidence;
      this.filters.width = value.width;
      this.filters.height = value.height;
    });
  },
  mounted() {
    this.get().folders();
  },
  beforeUnmount() {
    this.liveReload = false;
    this.emitter.off('setFilters');
  },
  methods: {
    getHeight() {
      return this.$refs.header.clientHeight;
    },
    get() {
      const $this = this;
      return {
        async folders() {
          try {
            $this.createFolder.loading = true;
            const { data } = await ApiService.get('filesystem/folders');
            $this.emitter.emit('folders', data);
            $this.folders = ['add new', ...data];
            $this.createFolder.loading = false;
          } catch (error) {
            $this.emitter.emit('error', error);
          }
        },
      };
    },
    create() {
      const $this = this;
      return {
        async folder() {
          try {
            if (!$this.createFolder.name) return;
            $this.createFolder.show = false;
            $this.folder = $this.createFolder.name.toLowerCase();
            $this.$nextTick(() => {
              ApiService.post(`filesystem/folders/${$this.folder}`);
              $this.get().folders();
              $this.$toast.add({
                severity: 'success',
                detail: 'Folder created',
                life: 3000,
              });
            });
          } catch (error) {
            $this.emitter.emit('error', error);
          }
        },
      };
    },
    remove() {
      this.emitter.emit('clearSelected');
      const $this = this;
      return {
        async folder() {
          $this.$confirm.require({
            header: 'Confirmation',
            message: `Do you want to remove the training folder for ${$this.folder}?`,
            acceptClass: 'p-button-danger',
            position: 'top',
            accept: async () => {
              try {
                await ApiService.delete(`filesystem/folders/${$this.folder}`);
                await $this.get().folders();
                $this.emitter.emit('realoadTrain');
                $this.folder = null;
              } catch (error) {
                $this.emitter.emit('error', error);
              }
            },
          });
        },
      };
    },
    refresh() {
      if (this.type === 'match') this.$parent.get().matches();
      if (this.type === 'train') this.$parent.init();
    },
    async getMatchesInterval() {
      if (!this.liveReload) return;
      await this.$parent.get().matches();
      await Sleep(1000);
      await this.getMatchesInterval();
    },
    addComma(length, index) {
      return length - 1 === index ? ' ' : ',';
    },
    getFilters() {
      return this.filters;
    },
  },
  watch: {
    dropdowns: {
      handler(value) {
        this.selected.names = this.selected.names
          ? this.selected.names.flatMap((item) => (value.names.includes(item) ? item : []))
          : value.names;
        this.selected.detectors = this.selected.detectors
          ? this.selected.detectors.flatMap((item) => (value.detectors.includes(item) ? item : []))
          : value.detectors;
        this.selected.matches = this.selected.matches
          ? this.selected.matches.flatMap((item) => (value.matches.includes(item) ? item : []))
          : value.matches;

        if (!this.selected.names.length && !this.selected.detectors.length && !this.selected.matches.length) {
          this.selected.names = value.names;
          this.selected.detectors = value.detectors;
          this.selected.matches = value.matches;
        }
      },
      deep: true,
    },
    selected: {
      handler(value) {
        this.filters.names = value?.names || [];
        this.filters.matches = value?.matches || [];
        this.filters.detectors = value?.detectors || [];
      },
      deep: true,
    },
    async liveReload(value) {
      this.emitter.emit('liveReload', value);
      if (value) {
        this.getMatchesInterval();
      }
    },
    folder(value) {
      if (value === 'add new') {
        this.folder = null;
        this.createFolder.name = null;
        this.createFolder.show = true;
      }
      this.emitter.emit('trainingFolder', value);
    },
  },
  computed: {
    uploadUrl() {
      return `${Constants().api}/train/add/${this.folder}`;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';

.header-wrapper {
  background: var(--surface-a);
  position: fixed;
  left: 50%;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  transform: translateX(-50%);
  width: 100%;
  max-width: $max-width;
  z-index: 4;

  .p-fileupload {
    ::v-deep(.p-button) {
      padding: 0.4375rem 0.65625rem;
      font-size: 0.875rem;
    }
    @media only screen and (max-width: 576px) {
      ::v-deep(.p-button-icon) {
        margin-right: 0;
        font-size: 1rem;
      }
      ::v-deep(.p-button-label) {
        font-size: 0;
      }
    }
  }

  @media only screen and (max-width: 576px) {
    .responsive-button {
      width: 2.357rem;
      ::v-deep(.p-button-icon) {
        margin-right: 0;
      }
      ::v-deep(.p-button-label) {
        font-size: 0;
      }
    }
  }

  .p-button ::v-deep(.fa.p-button-icon),
  .p-button ::v-deep(.fas.p-button-icon),
  .p-button ::v-deep(.far.p-button-icon),
  .p-button ::v-deep(.pi) {
    font-size: 1rem;
  }
  .p-button ::v-deep(.push-top) {
    position: relative;
    top: 1px;
  }

  .p-inputtext {
    width: 175px;
    font-size: 0.9rem;
    @media only screen and (max-width: 576px) {
      font-size: 16px;
    }
  }

  .p-dropdown {
    width: 175px;
    @media only screen and (max-width: 768px) {
      &.train {
        width: 155px;
      }
    }
    @media only screen and (max-width: 576px) {
      &.train {
        width: 135px;
      }
    }
    ::v-deep(.p-inputtext) {
      font-size: 0.9rem;
      @media only screen and (max-width: 576px) {
        font-size: 1rem;
        padding: 0.58rem 0.75rem;
      }
    }
  }

  ::v-deep(.p-inputnumber .p-inputtext) {
    font-size: 0.9rem;
    @media only screen and (max-width: 576px) {
      font-size: 16px;
    }
  }
  ::v-deep(.p-multiselect .p-multiselect-label) {
    font-size: 0.9rem;
  }
}

.fixed-sub {
  display: none;
  background: var(--surface-a);
  position: absolute;
  top: 100%;
  left: 50%;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  transform: translateX(-50%);
  width: 100%;
  max-width: $max-width;
  z-index: 3;
  transition: all 0.5s;
  box-shadow: inset 0 25px 15px -20px rgba(0, 0, 0, 0.5), 0 5px 15px 0 rgba(0, 0, 0, 0.5);

  &.show {
    display: block;
  }

  label,
  .stats-text {
    font-size: 13px;
    @media only screen and (max-width: 576px) {
      font-size: 11px;
    }
  }

  .p-dropdown,
  .p-inputtext {
    width: 100%;
  }
}
</style>
