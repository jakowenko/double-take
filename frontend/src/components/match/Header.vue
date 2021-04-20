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
              label="Create"
              class="p-button-success p-button-sm"
              @click="
                createFolder.show = false;
                folder = createFolder.name.toLowerCase();
                $nextTick(() => {
                  $parent.create().folder();
                });
              "
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
            <Dropdown
              v-model="folder"
              :options="folders"
              :placeholder="loading.folders ? '...' : 'Train'"
              :disabled="loading.folders"
              :showClear="true"
            />
          </div>
          <div>
            <Button
              v-if="folder"
              icon="pi pi-check"
              class="p-button-success p-button-sm"
              :disabled="matches.selected.length === 0 || !folder"
              @click="$parent.train"
            />
          </div>
        </div>
        <div class="p-d-inline-flex p-ai-center">
          <div class="p-mr-1">
            <Button
              :label="toggleAllState ? 'Deselect All' : 'Select All'"
              class="p-button-text p-button-sm"
              @click="
                toggleAllState = !toggleAllState;
                $parent.toggleAll(toggleAllState);
              "
              :disabled="loading.files"
            />
          </div>
          <div>
            <Button
              icon="pi pi-trash"
              class="p-button-danger p-button-sm p-mr-1"
              @click="$parent.remove().files($event)"
              :disabled="matches.selected.length === 0"
            />
            <Button
              icon="pi pi-refresh"
              class="p-button p-button-sm p-mr-1"
              @click="$parent.get().matches()"
              :disabled="loading.files"
            />
            <Button
              icon="pi pi-cog"
              class="p-button p-button-sm"
              @click="showFilter = !showFilter"
              :disabled="loading.files"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="fixed fixed-sub p-shadow-5 p-pl-3 p-pr-3" :class="{ show: showFilter }">
      <div class="p-grid">
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Filter by name:</label>
            <MultiSelect v-model="filter.name" :options="names" @change="$emit('filter', filter)" />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Filter by match:</label>
            <MultiSelect v-model="filter.match" :options="['match', 'miss']" @change="$emit('filter', filter)" />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Filter by detector:</label>
            <MultiSelect v-model="filter.detector" :options="detectors" @change="$emit('filter', filter)" />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Min confidence:</label>
            <InputNumber
              v-model="filter.confidence"
              mode="decimal"
              :min="0"
              :max="100"
              suffix="%"
              @input="
                filter.confidence = $event.value > 100 ? 100 : $event.value < 0 ? 0 : $event.value;
                $emit('filter', filter);
              "
            />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Min box width:</label>
            <InputNumber
              v-model="filter.width"
              mode="decimal"
              :min="0"
              suffix="px"
              @input="
                filter.width = $event.value;
                $emit('filter', filter);
              "
            />
          </div>
        </div>
        <div class="p-col-4 p-md-2 p-lg-2">
          <div class="p-fluid">
            <label class="p-d-block p-mb-1">Min box height:</label>
            <InputNumber
              v-model="filter.height"
              mode="decimal"
              :min="0"
              suffix="px"
              @input="
                filter.height = $event.value;
                $emit('filter', filter);
              "
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import MultiSelect from 'primevue/multiselect';

export default {
  components: {
    Button,
    Dropdown,
    InputText,
    InputNumber,
    MultiSelect,
  },
  data() {
    return {
      folder: null,
      createFolder: {
        name: null,
        show: false,
      },
      toggleAllState: false,
      showFilter: false,
      filter: {
        name: null,
        match: ['match', 'miss'],
        detector: null,
        confidence: 0,
        width: 0,
        height: 0,
      },
    };
  },
  props: {
    matches: Object,
    folders: Array,
    loading: Object,
  },
  mounted() {
    this.$emit('filter', this.filter);
  },
  methods: {},
  watch: {
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
        return;
      }
      this.$emit('trainingFolder', value);
    },
    // eslint-disable-next-line object-shorthand
    'matches.source'() {
      this.toggleAllState = false;
    },
  },
  computed: {
    names() {
      return this.matches.source.map((obj) => obj.name).filter((value, index, self) => self.indexOf(value) === index);
    },
    detectors() {
      return this.matches.source
        .map((obj) => obj.detector)
        .filter((value, index, self) => self.indexOf(value) === index);
    },
  },
};
</script>

<style scoped lang="scss">
.wrapper {
  padding-top: 60px;
}
.fixed {
  background: var(--surface-a);
  position: fixed;
  top: 0;
  left: 50%;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  transform: translateX(-50%);
  width: 100%;
  max-width: 1000px;
  z-index: 4;

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
  }
  ::v-deep(.p-inputnumber .p-inputtext) {
    font-size: 0.9rem;
  }
  ::v-deep(.p-multiselect .p-multiselect-label) {
    font-size: 0.9rem;
  }

  &.fixed-sub {
    background: var(--surface-50);
    top: -100px;
    z-index: 3;
    padding-top: 0.6rem;
    padding-bottom: 0;
    transition: all 0.25s;

    &.show {
      display: block;
      top: 55px;
    }

    label {
      font-size: 13px;
    }

    .p-dropdown {
      width: 100%;
    }
  }
}
</style>
