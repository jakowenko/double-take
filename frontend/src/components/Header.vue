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
                class="p-button-sm"
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
        <SpeedDial
          :model="speedDial"
          direction="left"
          :hideOnClickOutside="false"
          :tooltipOptions="{ position: 'top' }"
        />
      </div>
    </div>
    <div v-if="type === 'match'" class="fixed-sub p-pl-3 p-pr-3" :class="{ show: showFilter }">
      <div class="p-grid p-ai-center">
        <div class="p-col-6 p-pb-0 stats-text">{{ stats.current }} of {{ stats.total }}</div>
        <div class="p-col-6 p-d-flex p-jc-end p-pb-0 p-ai-center socket-status">
          WebSocket
          <div class="icon p-badge p-ml-1" :class="socketClass"></div>
        </div>
        <div class="p-col custom-col">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Name</label>
            <MultiSelect v-model="selected.names" :options="dropdowns.names" v-on:change="emitter.emit('updateFilter')">
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
        <div class="p-col custom-col-sm">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Match</label>
            <MultiSelect
              v-model="selected.matches"
              :options="dropdowns.matches"
              v-on:change="emitter.emit('updateFilter')"
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
        <div class="p-col custom-col">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Detector</label>
            <MultiSelect
              v-model="selected.detectors"
              :options="dropdowns.detectors"
              v-on:change="emitter.emit('updateFilter')"
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
        <div class="p-col custom-col">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Camera</label>
            <MultiSelect
              v-model="selected.cameras"
              :options="dropdowns.cameras"
              v-on:change="emitter.emit('updateFilter')"
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
        <div class="p-col custom-col">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Type</label>
            <MultiSelect v-model="selected.types" :options="dropdowns.types" v-on:change="emitter.emit('updateFilter')">
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
        <div class="p-col custom-col-xsm">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1" v-tooltip.left="'Minimum confidence (%)'">%</label>
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
                emitter.emit('updateFilter');
              "
            />
          </div>
        </div>
        <div class="p-col custom-col-xsm">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1" v-tooltip.left="'Minimum box height (pixels)'">Width</label>
            <InputText
              v-model="filters.width"
              type="number"
              @input="
                $event.target.value = $event.target.value < 0 || $event.target.value === '' ? 0 : $event.target.value;
                filters.width = $event.target.value === '' ? 0 : parseFloat($event.target.value);
                emitter.emit('updateFilter');
              "
            />
          </div>
        </div>
        <div class="p-col custom-col-xsm">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1" v-tooltip.left="'Minimum box width (pixels)'">Height</label>
            <InputText
              v-model="filters.height"
              type="number"
              @input="
                $event.target.value = $event.target.value < 0 || $event.target.value === '' ? 0 : $event.target.value;
                filters.height = $event.target.value === '' ? 0 : parseFloat($event.target.value);
                emitter.emit('updateFilter');
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
import SpeedDial from '@/components/SpeedDial.vue';

import Constants from '@/util/constants.util';
import ApiService from '@/services/api.service';

export default {
  components: {
    Button,
    Dropdown,
    InputText,
    MultiSelect,
    FileUpload,
    SpeedDial,
  },
  data: () => ({
    speedDial: [],
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
    showFilter: false,
    filters: {
      names: [],
      matches: [],
      detectors: [],
      cameras: [],
      types: [],
      confidence: 0,
      width: 0,
      height: 0,
    },
    selected: {},
    socketClass: 'p-badge-secondary',
  }),
  props: {
    areAllSelected: Boolean,
    dropdowns: Object,
    stats: Object,
    matches: Object,
    loading: Object,
    type: String,
    toolbarHeight: Number,
    socket: Object,
  },
  mounted() {
    this.get().folders();

    this.speedDial = [
      {
        label: 'Filters',
        icon: 'pi pi-cog',
        command: () => {
          this.showFilter = !this.showFilter;
        },
      },
      {
        label: 'Refresh',
        icon: 'pi pi-refresh',
        command: () => {
          if (this.loading.files || this.loading.status) return;
          if (this.type === 'match') this.$parent.get().matches({ delay: 500 });
          if (this.type === 'train') this.$parent.init();
        },
      },
      {
        label: 'Toggle All',
        icon: 'far fa-check-square',
        command: () => {
          if (!this.matches.source.length || this.loading.status) return;
          this.$parent.toggleAll(!this.areAllSelected);
        },
      },
      {
        label: 'Trash',
        icon: 'pi pi-trash',
        command: () => {
          if (!this.matches.selected.length) return;
          this.$parent.remove().files();
        },
      },
    ];

    if (this.type === 'train') {
      const index = this.speedDial.findIndex(({ label }) => label.toLowerCase() === 'filters');
      if (index > -1) this.speedDial.splice(index, 1);
    }

    if (this.socket) {
      this.socket.on('connect', () => {
        this.socketClass = 'p-badge-success';
      });
      this.socket.on('disconnect', () => {
        this.socketClass = 'p-badge-danger';
      });
      this.socket.on('connect_error', () => {
        this.socketClass = 'p-badge-danger';
      });
      this.socketClass = this.socket.connected ? 'p-badge-success' : 'p-badge-danger';
    }
  },
  methods: {
    getHeight() {
      return this.$refs.header.offsetHeight;
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
    addComma(length, index) {
      return length - 1 === index ? ' ' : ',';
    },
    getFilters() {
      return this.filters;
    },
  },
  watch: {
    'loading.files': function (value) {
      const target = this.speedDial.find(({ label }) => label.toLowerCase() === 'refresh');
      target.icon = value ? 'pi pi-spin pi-spinner' : 'pi pi-refresh';
    },
    areAllSelected(value) {
      const target = this.speedDial.find(({ label }) => label.toLowerCase() === 'toggle all');
      target.icon = value ? 'fa fa-check-square' : 'far fa-check-square';
    },
    dropdowns: {
      handler(value) {
        ['names', 'detectors', 'matches', 'cameras', 'types'].forEach((key) => {
          if (
            JSON.stringify(
              this.selected[key] ? this.selected[key].flatMap((item) => (value[key].includes(item) ? item : [])) : [],
            ) !== JSON.stringify(value[key])
          ) {
            this.selected[key] = value[key];
          }
        });
      },
      deep: true,
    },
    selected: {
      handler(value) {
        ['names', 'detectors', 'matches', 'cameras', 'types'].forEach((key) => {
          this.filters[key] = value?.[key] || [];
        });
      },
      deep: true,
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

::v-deep(.p-speeddial) {
  position: relative;
  display: inline-flex;
  align-self: center;

  .p-button {
    width: 2rem;
    height: 2rem;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);

    &:focus {
      box-shadow: none;
    }
  }

  .p-button-icon {
    font-size: 0.8rem !important;
  }

  ul.p-speeddial-list {
    position: absolute;
    top: 50%;
    margin-top: -0.9rem;
    right: 2rem;
    .p-speeddial-action {
      width: 1.8rem;
      height: 1.8rem;
      text-decoration: none;
    }
    .p-speeddial-action-icon {
      font-size: 0.8rem !important;
    }
  }
}

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
    @media only screen and (max-width: 576px) {
      ::v-deep(.p-button-icon) {
        margin-right: 0;
      }
      ::v-deep(.p-button-label) {
        font-size: 0;
        display: none;
      }
    }
  }

  @media only screen and (max-width: 576px) {
    .responsive-button {
      width: auto;
      min-width: auto;
      ::v-deep(.p-button-icon) {
        margin-right: 0;
      }
      ::v-deep(.p-button-label) {
        font-size: 0;
        display: none;
      }
    }
  }

  .p-button.p-button-icon-only {
    width: auto;
  }

  .custom-col,
  .custom-col-sm,
  .custom-col-xsm {
    width: 16.5%;
    flex: 0 0 auto;
    @media screen and (max-width: 1000px) {
      width: 25% !important;
    }
  }
  .custom-col-sm {
    width: 10%;
  }
  .custom-col-xsm {
    width: 8%;
  }

  // .p-button ::v-deep(.fa.p-button-icon),
  // .p-button ::v-deep(.fas.p-button-icon),
  // .p-button ::v-deep(.far.p-button-icon),
  // .p-button ::v-deep(.pi) {
  //   font-size: 1rem;
  // }
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
        // padding to keep toolbar height consistent when "add new" is selected
        padding-top: 0.66rem;
        padding-bottom: 0.66rem;
      }
    }
  }

  ::v-deep(.p-inputtext) {
    font-size: 0.9rem;
    @media only screen and (max-width: 576px) {
      font-size: 16px;
    }
  }
  ::v-deep(.p-multiselect .p-multiselect-label) {
    font-size: 0.9rem;
    @media only screen and (max-width: 576px) {
      padding-top: 0.7rem;
      padding-bottom: 0.7rem;
    }
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
    font-size: 12px;
  }

  label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .p-inputtext {
    width: 100%;
  }
}

.socket-status {
  font-size: 12px;
  .icon {
    top: 1px;
  }
}
</style>
