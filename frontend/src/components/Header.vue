<template>
  <div class="wrapper">
    <div class="fixed p-shadow-5 p-pl-3 p-pr-3">
      <div v-if="createFolder.show" class="p-d-flex p-jc-between">
        <div class="p-d-inline-flex p-ai-center">
          <div class="p-mr-2">
            <InputText type="text" v-model="createFolder.name" placeholder="folder name" />
          </div>
          <div>
            <Button
              icon="pi pi-check"
              class="p-button-success p-button-sm"
              @click="create().folder()"
              :disabled="!createFolder.name"
            />
          </div>
        </div>
        <div class="p-d-inline-flex p-ai-center">
          <Button label="Cancel" class="p-button-text p-button-sm p-ml-2" @click="createFolder.show = false" />
        </div>
      </div>
      <div v-else class="p-d-flex p-jc-between">
        <div class="p-d-inline-flex p-ai-center">
          <div class="p-mr-2">
            <Dropdown v-model="folder" :options="folders" :disabled="createFolder.loading" :showClear="true" />
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
            <div v-if="type === 'train'">
              <FileUpload
                mode="basic"
                name="files[]"
                :url="uploadUrl"
                accept="image/*"
                :maxFileSize="10000000"
                @upload="$parent.init()"
                :auto="true"
                chooseLabel="Upload"
                class="p-d-inline"
              />
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
                  matches.source.filter((obj) => obj.name === folder && obj.results.length).length
                    ? 'Untrain'
                    : 'Remove'
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
              icon="pi pi-refresh"
              :class="[{ loading: loading.files }, 'p-button p-button-sm p-mr-1 reload-btn']"
              @click="refresh"
              :disabled="liveReload || loading.files || loading.status"
            />
            <Button
              :icon="areAllSelected ? 'fa fa-check-square' : 'far fa-check-square'"
              class="p-button p-button-sm p-mr-1"
              @click="$parent.toggleAll(!areAllSelected)"
              :disabled="(loading.files && !liveReload) || loading.status"
            />
            <Button
              v-if="type === 'match'"
              icon="pi pi-cog"
              class="p-button p-button-sm"
              @click="showFilter = !showFilter"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="type === 'match'" class="fixed fixed-sub p-shadow-5 p-pl-3 p-pr-3" :class="{ show: showFilter }">
      <div class="p-grid p-ai-center">
        <div class="p-col-6 p-pb-0 stats-text">{{ stats.filtered }} of {{ stats.source }}</div>
        <div class="p-col-6 p-d-flex p-jc-end p-pb-0">
          <div class="p-field-checkbox p-mb-0">
            <label for="liveReload" class="p-mr-1">Live Reload</label>
            <Checkbox id="liveReload" v-model="liveReload" :binary="true" />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Filter by name:</label>
            <MultiSelect v-model="filter.name" :options="names" />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Filter by match:</label>
            <MultiSelect v-model="filter.match" :options="['match', 'miss']" />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Filter by detector:</label>
            <MultiSelect v-model="filter.detector" :options="detectors" />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Min confidence (%):</label>
            <InputText
              v-model="filter.confidence"
              type="number"
              @input="
                $event.target.value =
                  $event.target.value > 100
                    ? 100
                    : $event.target.value < 0 || $event.target.value === ''
                    ? 0
                    : $event.target.value;
                filter.confidence = $event.target.value === '' ? 0 : parseFloat($event.target.value);
              "
            />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Min box width (px):</label>
            <InputText
              v-model="filter.width"
              type="number"
              @input="
                $event.target.value = $event.target.value < 0 || $event.target.value === '' ? 0 : $event.target.value;
                filter.width = $event.target.value === '' ? 0 : parseFloat($event.target.value);
              "
            />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Min box height (px):</label>
            <InputText
              v-model="filter.height"
              type="number"
              @input="
                $event.target.value = $event.target.value < 0 || $event.target.value === '' ? 0 : $event.target.value;
                filter.height = $event.target.value === '' ? 0 : parseFloat($event.target.value);
              "
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ApiService from '@/services/api.service';
import Constants from '@/util/constants.util';
import FileUpload from 'primevue/fileupload';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Checkbox from 'primevue/checkbox';
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
    createFolder: {
      name: null,
      show: false,
      loading: false,
    },
    folder: null,
    folders: [],
    liveReload: null,
    showFilter: false,
    filter: {
      name: null,
      match: ['match', 'miss'],
      detector: null,
      confidence: 0,
      width: 0,
      height: 0,
    },
  }),
  props: {
    areAllSelected: Boolean,
    matches: Object,
    loading: Object,
    stats: Object,
    type: String,
  },
  mounted() {
    this.emitter.emit('filter', this.filter);
    this.get().folders();
  },
  beforeUnmount() {
    this.liveReload = false;
  },
  methods: {
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
            message: `Do you want to remove the training folder and images for ${$this.folder}?`,
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
  },
  watch: {
    async liveReload(value) {
      this.emitter.emit('liveReload', value);
      if (value) {
        this.getMatchesInterval();
      }
    },
    names(values) {
      this.filter.name = values;
    },
    detectors(values) {
      this.filter.detector = values;
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
    names() {
      const names = [];
      this.matches.source.forEach((obj) => {
        if (obj.response) {
          obj.response.forEach((detector) => {
            names.push(...detector.results.map((item) => item.name));
          });
        }
      });

      return names.filter((item, i, ar) => ar.indexOf(item) === i);
    },
    detectors() {
      const detectors = [];
      this.matches.source.forEach((obj) => {
        if (obj.response) {
          obj.response.forEach(({ detector }) => {
            detectors.push(detector);
          });
        }
      });

      return detectors.filter((item, i, ar) => ar.indexOf(item) === i);
    },
    uploadUrl() {
      return `${Constants().api}/train/add/${this.folder}`;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';
.wrapper {
  padding-top: $match-header-height;
}
.fixed {
  background: var(--surface-a);
  position: fixed;
  top: $tool-bar-height;
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
    .responsive-button ::v-deep(.p-button-icon) {
      margin-right: 0;
    }
    .responsive-button ::v-deep(.p-button-label) {
      font-size: 0;
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

  .p-dropdown {
    width: 120px;
    &::v-deep(.p-dropdown-label) {
      @media only screen and (max-width: 576px) {
        font-size: 16px;
      }
    }
  }
  .p-inputtext {
    width: 120px;
    font-size: 0.9rem;
    @media only screen and (max-width: 576px) {
      font-size: 16px;
    }
  }

  ::v-deep(.p-dropdown .p-inputtext) {
    font-size: 0.9rem;
    @media only screen and (max-width: 576px) {
      font-size: 16px;
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

  &.fixed-sub {
    background: var(--surface-a);
    top: -100px;
    z-index: 3;
    padding-top: 0.75rem;
    padding-bottom: 0;
    transition: all 0.25s;

    &.show {
      display: block;
      top: $tool-bar-height + $match-header-height;
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
}
</style>
