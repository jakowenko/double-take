<template>
  <div>
    <div class="container fixed-top pt-2 pb-2">
      <div class="row">
        <div class="col-6 text-start">
          <select v-if="folders.length" v-model="selectedName" class="form-select form-select-sm">
            <option value="">Name:</option>
            <option v-for="f in folders" :key="f">
              {{ f }}
            </option>
          </select>
          <select v-else class="form-select form-select-sm" disabled>
            <option>No names found</option>
          </select>
          <button
            @click="trainFiles"
            class="btn btn-success btn-sm"
            :disabled="filesSelected.length === 0 || !nameSelected"
          >
            Train
          </button>
        </div>
        <div class="col-6 text-end">
          <button @click="toggleAll" class="btn btn-light btn-sm" style="margin-right: 15px">
            {{ toggleAllSelected ? 'Deselect All' : 'Select All' }}
          </button>
          <button @click="deleteFiles" class="btn btn-danger btn-sm" :disabled="filesSelected.length === 0">
            Delete
          </button>
        </div>
      </div>
    </div>
    <div class="container pt-2 pb-2">
      <div v-if="loading" class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
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
import axios from 'axios';
import ImageTable from '@/components/ImageTable.vue';

export default {
  components: {
    ImageTable,
  },
  data() {
    return {
      info: null,
      folders: [],
      files: [],
      selectedName: '',
      toggleAllSelected: false,
      toggleAllText: 'Select All',
      loading: true,
    };
  },
  mounted() {
    axios.get(`${process.env.VUE_APP_API}/train/manage`).then((response) => {
      this.folders = response.data.folders;
      this.files = response.data.files;
      this.loading = false;
    });
  },
  methods: {
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
        selected: !!this.toggleAllSelected,
      }));
    },
    trainFiles() {
      if (
        confirm(
          `Train ${this.filesSelected.length} ${this.filesSelected.length > 1 ? 'files' : 'file'} for ${
            this.selectedName
          }?`,
        )
      ) {
        axios
          .post(`${process.env.VUE_APP_API}/train/manage/move`, {
            folder: this.selectedName,
            files: this.filesSelected,
          })
          .then((/* response */) => {
            this.files.forEach((file) => {
              if (file.selected) {
                file.disabled = true;
                file.selected = false;
              }
            });
          })
          .catch((/* error */) => {});
      }
    },
    deleteFiles() {
      if (confirm(`Delete ${this.filesSelected.length} ${this.filesSelected.length > 1 ? 'files' : 'file'}?`)) {
        axios
          .post(`${process.env.VUE_APP_API}/train/manage/delete`, this.filesSelected)
          .then((/* response */) => {
            this.files.forEach((file) => {
              if (file.selected) {
                file.disabled = true;
                file.selected = false;
              }
            });
          })
          .catch((/* error */) => {});
      }
    },
    lazyLoad() {
      let lazyImages = [].slice.call(document.querySelectorAll('img.lazy'));

      lazyImages.forEach((lazyImage, i) => {
        setTimeout(() => {
          const [file] = this.files.filter((obj) => obj.filename === lazyImage.dataset.filename);
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
    nameSelected() {
      return this.selectedName !== '';
    },
  },
};
</script>

<style scoped lang="scss">
.spinner-border {
  margin-top: 25px;
  margin-bottom: 25px;
}
.fixed-top {
  border-bottom: 1px solid #eaeaea;
}
.form-select {
  text-align: left;
  width: 60%;
  display: inline-block;
  margin-right: 15px;
  font-size: 16px;
}
</style>
