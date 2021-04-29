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
          <div>
            <Button
              icon="pi pi-trash"
              class="p-button-danger p-button-sm p-mr-1"
              @click="$parent.remove().files($event)"
              :disabled="matches.selected.length === 0"
            />
            <Button
              :icon="toggleAllState ? 'fa fa-check-square' : 'far fa-check-square'"
              class="p-button p-button-sm p-mr-1"
              @click="
                toggleAllState = !toggleAllState;
                $parent.toggleAll(toggleAllState);
              "
              :disabled="loading.files"
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
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';

export default {
  components: {
    Button,
    Dropdown,
    InputText,
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
      const names = [];
      this.matches.source.forEach((obj) => {
        obj.response.forEach((detector) => {
          names.push(...detector.results.map((item) => item.name));
        });
      });

      return names.filter((item, i, ar) => ar.indexOf(item) === i);
    },
    detectors() {
      const detectors = [];
      this.matches.source.forEach((obj) => {
        obj.response.forEach(({ detector }) => {
          detectors.push(detector);
        });
      });

      return detectors.filter((item, i, ar) => ar.indexOf(item) === i);
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

  .p-button ::v-deep(.fa.p-button-icon),
  .p-button ::v-deep(.fas.p-button-icon),
  .p-button ::v-deep(.far.p-button-icon) {
    font-size: 1rem;
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
