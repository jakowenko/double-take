<template>
  <div class="wrapper">
    <div class="fixed p-shadow-5 p-pl-3 p-pr-3">
      <div v-if="createFolder" class="p-d-flex p-jc-between">
        <div class="p-d-inline-flex p-ai-center">
          <div class="p-mr-2">
            <InputText type="text" v-model="createFolderName" placeholder="folder name" />
          </div>
          <div>
            <Button
              label="Create"
              class="p-button-success p-button-sm"
              @click="
                createFolder = false;
                folder = createFolderName.toLowerCase();
                $nextTick(() => {
                  $parent.create().folder();
                });
              "
              :disabled="!createFolderName"
            />
          </div>
        </div>
        <div class="p-d-inline-flex p-ai-center">
          <Button label="Cancel" class="p-button-text p-button-sm p-ml-2" @click="createFolder = false" />
        </div>
      </div>
      <div v-else class="p-d-flex p-jc-between">
        <div class="p-d-inline-flex p-ai-center">
          <div class="p-mr-2">
            <Dropdown
              v-model="folder"
              :options="folders"
              :placeholder="loading.folders ? '...' : 'Name'"
              :disabled="loading.folders"
              :showClear="true"
            />
          </div>
          <div>
            <Button
              v-if="folder"
              label="Train"
              class="p-button-success p-button-sm"
              :disabled="filesSelected.length === 0 || !folder"
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
              iconPos="left"
              icon="pi pi-trash"
              class="p-button-danger p-button-sm"
              @click="$parent.remove().files($event)"
              :disabled="filesSelected.length === 0"
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

export default {
  components: {
    Button,
    Dropdown,
    InputText,
  },
  data() {
    return {
      folder: null,
      createFolder: false,
      createFolderName: null,
      toggleAllState: false,
    };
  },
  props: {
    folders: Array,
    filesSelected: Array,
    loading: Object,
  },
  mounted() {},
  watch: {
    folder(value) {
      if (value === 'add new') {
        this.folder = null;
        this.createFolderName = null;
        this.createFolder = true;
        return;
      }
      this.$emit('selectedFolder', value);
    },
  },
};
</script>

<style scoped lang="scss">
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
  z-index: 3 !important;
}

.wrapper {
  padding-top: 60px;
}

.p-inputtext {
  width: 135px;
  @media only screen and (max-width: 576px) {
    font-size: 16px;
  }
}

.p-dropdown ::v-deep {
  width: 135px;
  .p-dropdown-label {
    @media only screen and (max-width: 576px) {
      font-size: 16px;
    }
  }
}
</style>
