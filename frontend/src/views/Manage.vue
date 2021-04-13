<template>
  <div class="wrapper">
    <HeaderManage
      :loading="loading"
      :folders="folders"
      :filesSelected="filesSelected"
      @selectedFolder="selectedFolder = $event"
    />
    <div class="p-d-flex p-jc-center p-p-3">
      <i v-if="loading.files" class="pi pi-spin pi-spinner" style="font-size: 3rem"></i>
      <ImageTable v-else :files="files" @toggle="selected" @files-rendered="lazy" style="width: 100%"></ImageTable>
    </div>
  </div>
</template>

<script>
import ApiService from '@/services/api.service';
import ImageTable from '@/components/ImageTable.vue';
import HeaderManage from '@/components/HeaderManage.vue';

export default {
  components: {
    HeaderManage,
    ImageTable,
  },
  data() {
    return {
      info: null,
      folders: [],
      filteredFolders: [],
      files: [],
      loading: {
        folders: false,
        files: false,
        createFolder: false,
      },
      selectedFolder: null,
      displayAddFolderModal: false,
      newFolder: null,
    };
  },
  computed: {
    filesSelected() {
      const files = this.files.filter((file) => file.selected && !file.disabled);
      files.forEach((file) => {
        delete file.tmp;
      });
      return files;
    },
    isNewFolder() {
      if (!this.selectedFolder) return false;
      return !this.folders.includes(this.selectedFolder);
    },
  },
  async mounted() {
    await this.init();
  },
  methods: {
    async init() {
      const promises = [];
      promises.push(this.get().files());
      promises.push(this.get().folders());
      await Promise.all(promises);
    },
    get() {
      const app = this;
      return {
        async folders() {
          try {
            app.loading.folders = true;
            const { data } = await ApiService.get('filesystem/folders');
            setTimeout(() => {
              app.folders = ['add new', ...data];
              app.loading.folders = false;
            }, 250);
          } catch (error) {
            app.$toast.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message,
              life: 3000,
            });
          }
        },
        async files() {
          try {
            app.loading.files = true;
            const { data } = await ApiService.get('filesystem/files');
            app.files = data;
            app.loading.files = false;
          } catch (error) {
            app.$toast.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message,
              life: 3000,
            });
          }
        },
      };
    },
    remove() {
      const app = this;
      return {
        async files() {
          try {
            const description = `${app.filesSelected.length} ${app.filesSelected.length > 1 ? 'files' : 'file'}`;
            app.$confirm.require({
              header: 'Confirmation',
              message: `Do you want to delete ${description}?`,
              acceptClass: 'p-button-danger',
              position: 'top',
              accept: async () => {
                const files = app.filesSelected.map((file) => ({ key: file.key }));
                try {
                  await ApiService.delete('filesystem/files', files);
                  app.files.forEach((file) => {
                    if (file.selected) {
                      file.disabled = true;
                      file.selected = false;
                    }
                  });
                  app.toast({
                    severity: 'success',
                    summary: 'Success',
                    detail: `${description} deleted`,
                  });
                  if (app.toggleAllSelected) {
                    app.get().files();
                    app.toggleAllSelected = false;
                  }
                } catch (error) {
                  app.toast({ severity: 'error', summary: 'Error', detail: error.message });
                }
              },
            });
          } catch (error) {
            app.toast({ severity: 'error', summary: 'Error', detail: error.message });
          }
        },
      };
    },
    create() {
      const app = this;
      return {
        async folder() {
          try {
            await ApiService.post(`filesystem/folders/${app.selectedFolder}`);
            app.get().folders();
            app.$toast.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Folder created',
            });
          } catch (error) {
            app.$toast.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message,
              life: 3000,
            });
          }
        },
      };
    },
    toast({ severity, summary, detail }) {
      this.$toast.add({
        severity,
        summary,
        detail,
        life: 3000,
      });
    },
    train() {
      const description = `${this.filesSelected.length} ${this.filesSelected.length > 1 ? 'files' : 'file'}`;
      this.$confirm.require({
        header: 'Confirmation',
        message: `Do you want to train ${description} for ${this.selectedFolder}?`,
        acceptClass: 'p-button-success',
        position: 'top',
        accept: () => {
          try {
            ApiService.post('/filesystem/files/move', {
              folder: this.selectedFolder,
              files: this.filesSelected,
            });
            ApiService.get(`/train/add/${this.selectedFolder}`);
            this.files.forEach((file) => {
              if (file.selected) {
                file.disabled = true;
                file.selected = false;
              }
            });
            this.toast({
              severity: 'success',
              summary: 'Success',
              detail: `${description} trained for ${this.selectedFolder}`,
            });
          } catch (error) {
            this.toast({
              severity: 'error',
              summary: 'Error',
              detail: error.message,
              life: 3000,
            });
          }
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
    toggleAll(toggleAllState) {
      this.files = this.files.map((file) => ({
        ...file,
        selected: !!toggleAllState && !file.disabled,
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
};
</script>

<style scoped lang="scss">
</style>
