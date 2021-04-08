<template>
  <div class="wrapper">
    <div class="fixed p-shadow-5 p-pl-3 p-pr-3">
      <div class="p-grid p-ai-center p-nogutter">
        <div class="p-col-6">
          <div class="p-grid p-ai-center p-nogutter">
            <div class="p-col p-mr-2">
              <Dropdown
                v-model="selectedFolder"
                :options="folders"
                :placeholder="loading ? '...' : 'Name'"
                :disabled="loading"
                :showClear="true"
              />
            </div>
            <div class="p-col">
              <Button
                label="Train"
                class="p-button-success p-button-sm"
                :disabled="filesSelected.length === 0 || !selectedFolder"
                @click="trainFiles($event)"
              />
            </div>
          </div>
        </div>
        <div class="p-col-6 p-text-right">
          <Button
            @click="toggleAll"
            :label="toggleAllSelected ? 'Deselect All' : 'Select All'"
            class="p-button-primary p-button-sm p-mr-2"
            :disabled="loading"
          />
          <Button
            @click="deleteFiles($event)"
            label="Delete"
            class="p-button-danger p-button-sm"
            :disabled="filesSelected.length === 0"
          />
        </div>
      </div>
    </div>

    <div class="p-d-flex p-jc-center">
      <div v-if="loading" class="p-pt-5 p-pb-5">
        <i class="pi pi-spin pi-spinner" style="font-size: 3rem"></i>
      </div>
      <div v-else>
        <ImageTable :files="files" @toggle="selected" @files-rendered="lazy"></ImageTable>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-restricted-globals */
/* eslint-disable no-restricted-globals */ /* eslint-disable no-alert */
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import axios from 'axios';
import ImageTable from '@/components/ImageTable.vue';

export default {
  components: {
    ImageTable,
    Dropdown,
    Button,
  },
  data() {
    return {
      info: null,
      folders: [],
      files: [],
      toggleAllSelected: false,
      toggleAllText: 'Select All',
      loading: true,
      selectedFolder: null,
    };
  },
  mounted() {
    axios.get(`${process.env.VUE_APP_API}/train/manage?limit=8`).then((response) => {
      this.folders = response.data.folders;
      this.files = response.data.files;
      this.loading = false;
    });
  },
  methods: {
    trainFiles() {
      const description = `${this.filesSelected.length} ${this.filesSelected.length > 1 ? 'files' : 'file'}`;
      this.$confirm.require({
        header: 'Train Confirmation',
        message: `Do you want to train ${description} for ${this.selectedFolder}?`,
        acceptClass: 'p-button-success',
        accept: () => {
          axios
            .post(`${process.env.VUE_APP_API}/train/manage/move`, {
              folder: this.selectedFolder,
              files: this.filesSelected,
            })
            .then((/* response */) => {
              this.files.forEach((file) => {
                if (file.selected) {
                  file.disabled = true;
                  file.selected = false;
                }
              });
              this.$toast.add({
                severity: 'success',
                summary: 'Success',
                detail: `${description} trained for ${this.selectedFolder}`,
                life: 3000,
              });
            })
            .catch((/* error */) => {
              this.$toast.add({
                severity: 'error',
                summary: 'Error',
                detail: `Error training ${description} for ${this.selectedFolder}`,
                life: 3000,
              });
            });
        },
      });
    },
    deleteFiles() {
      const description = `${this.filesSelected.length} ${this.filesSelected.length > 1 ? 'files' : 'file'}`;
      this.$confirm.require({
        header: 'Delete Confirmation',
        message: `Do you want to delete ${description}?`,
        acceptClass: 'p-button-danger',
        accept: () => {
          axios
            .post(`${process.env.VUE_APP_API}/train/manage/delete`, this.filesSelected)
            .then((/* response */) => {
              this.files.forEach((file) => {
                if (file.selected) {
                  file.disabled = true;
                  file.selected = false;
                }
              });
              this.$toast.add({
                severity: 'success',
                summary: 'Success',
                detail: `${description} deleted`,
                life: 3000,
              });
            })
            .catch((/* error */) => {
              this.$toast.add({
                severity: 'error',
                summary: 'Error',
                detail: `Error deleting ${description}`,
                life: 3000,
              });
            });
        },
      });
    },
    lazy() {
      this.lazyLoad();
    },
    selected(file) {
      if (file.disabled) return;
      file.selected = !file.selected;
    },
    toggleAll() {
      this.toggleAllSelected = !this.toggleAllSelected;
      this.files = this.files.map((file) => ({
        ...file,
        selected: !!this.toggleAllSelected && !file.disabled,
      }));
    },
    lazyLoad() {
      let lazyImages = [].slice.call(document.querySelectorAll('img.lazy'));

      lazyImages.forEach((lazyImage, i) => {
        setTimeout(() => {
          const [file] = this.files.filter((obj) => obj.key === lazyImage.dataset.key);
          if (file) file.loaded = true;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove('lazy');
          lazyImages = lazyImages.filter((image) => image !== lazyImage);
        }, 200 * i);
      });
    },
  },
  computed: {
    filesSelected() {
      const files = this.files.filter((file) => file.selected && !file.disabled);
      files.forEach((file) => {
        delete file.tmp;
      });
      return files;
    },
  },
};
</script>

<style scoped lang="scss">
.fixed {
  background-color: var(--surface-b);
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
.p-dropdown {
  width: 100%;
}
</style>
