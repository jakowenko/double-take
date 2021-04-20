<template>
  <div class="wrapper">
    <Header
      :loading="loading"
      :folders="['add new', ...folders]"
      :matches="matches"
      @trainingFolder="trainingFolder = $event"
      @filter="filter = $event"
    />
    <div class="p-d-flex p-jc-center p-p-3">
      <i v-if="loading.files" class="pi pi-spin pi-spinner" style="font-size: 3rem"></i>
      <Grid v-else :matches="{ filtered, ...matches }" :loading="loading" @toggle="selected" style="width: 100%" />
    </div>
  </div>
</template>

<script>
import ApiService from '@/services/api.service';
import Grid from '@/components/match/Grid.vue';
import Header from '@/components/match/Header.vue';

export default {
  components: {
    Header,
    Grid,
  },
  data() {
    return {
      info: null,
      folders: [],
      loading: {
        folders: false,
        files: false,
        createFolder: false,
      },
      matches: {
        source: [],
        selected: [],
        disabled: [],
        loaded: [],
      },
      filter: {},
      toggleAllState: null,
      trainingFolder: null,
    };
  },
  computed: {
    filtered() {
      const files = JSON.parse(JSON.stringify(this.matches.source));

      const name = this.filter.name || [];
      const match = this.filter.match || [];
      const detector = this.filter.detector || [];
      const confidence = this.filter.confidence || [];
      const width = this.filter.width || 0;
      const height = this.filter.height || 0;

      const filtered = files.map((file) => {
        const convertedMatch = file.match ? 'match' : 'miss';
        if (
          name.includes(file.name) &&
          match.includes(convertedMatch) &&
          detector.includes(file.detector) &&
          confidence <= file.confidence &&
          width <= file.box.width &&
          height <= file.box.height
        ) {
          return file;
        }
        return [];
      });
      return filtered.flat();
    },
  },
  async mounted() {
    await this.init();
  },
  watch: {
    filtered(current, previous) {
      if (current.length !== previous.length) this.lazyLoad();
    },
  },
  methods: {
    async init() {
      const promises = [];
      promises.push(this.get().matches());
      promises.push(this.get().folders());
      await Promise.all(promises);
    },
    get() {
      const $this = this;
      return {
        async folders() {
          try {
            $this.loading.folders = true;
            const { data } = await ApiService.get('filesystem/folders');
            $this.folders = data;
            $this.loading.folders = false;
          } catch (error) {
            $this.$toast.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message,
              life: 3000,
            });
          }
        },
        async matches() {
          try {
            $this.loading.files = true;
            const { data } = await ApiService.get('match');
            $this.matches.source = data.matches;
            $this.loading.files = false;
          } catch (error) {
            $this.$toast.add({
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
                  const matches = $this.matches.selected.map((obj) => ({ id: obj.id, key: obj.file.key }));
                  const ids = $this.matches.selected.map((obj) => obj.id);
                  await ApiService.delete('match', matches);
                  $this.matches.disabled = $this.matches.disabled.concat(ids);
                  $this.matches.selected = [];

                  $this.toast({
                    severity: 'success',
                    summary: 'Success',
                    detail: `${description} deleted`,
                  });
                  if ($this.toggleAllState) {
                    $this.get().matches();
                    $this.toggleAllState = false;
                  }
                } catch (error) {
                  $this.toast({ severity: 'error', summary: 'Error', detail: error.message });
                }
              },
            });
          } catch (error) {
            $this.toast({ severity: 'error', summary: 'Error', detail: error.message });
          }
        },
      };
    },
    create() {
      const $this = this;
      return {
        async folder() {
          try {
            await ApiService.post(`filesystem/folders/${$this.trainingFolder}`);
            $this.get().folders();
            $this.$toast.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Folder created',
            });
          } catch (error) {
            $this.$toast.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message,
              life: 3000,
            });
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
            const matches = $this.matches.selected.map((obj) => ({ id: obj.id, key: obj.file.key }));
            const ids = $this.matches.selected.map((obj) => obj.id);
            await ApiService.patch('match', {
              folder: this.trainingFolder,
              matches,
            });
            await ApiService.get(`/train/add/${this.trainingFolder}`);

            $this.matches.disabled = $this.matches.disabled.concat(ids);
            $this.matches.selected = [];

            this.toast({
              severity: 'success',
              summary: 'Success',
              detail: `${description} trained for ${this.trainingFolder}`,
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
    toast({ severity, summary, detail }) {
      this.$toast.add({
        severity,
        summary,
        detail,
        life: 3000,
      });
    },
    selected(match) {
      const { id } = match;
      if (this.matches.disabled.includes(id)) return;
      const index = this.matches.selected.findIndex((obj) => match.id === obj.id);
      if (index !== -1) this.matches.selected.splice(index, 1);
      else this.matches.selected.push(match);
    },
    toggleAll(state) {
      const available = this.filtered.filter((obj) => !this.matches.disabled.includes(obj.id)).map((obj) => obj.id);
      this.matches.selected = state ? available : [];
      this.toggleAllState = state;
    },
    lazyLoad() {
      const matches = this.filtered;
      matches.forEach((match, i) => {
        setTimeout(() => {
          this.matches.loaded.push(match.id);
        }, 200 * i);
      });
    },
  },
};
</script>

<style scoped lang="scss"></style>
