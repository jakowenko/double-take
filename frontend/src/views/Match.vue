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
      <i
        v-if="loading.files && !matches.source.length"
        class="pi pi-spin pi-spinner p-mt-5"
        style="font-size: 3rem"
      ></i>
      <Grid
        v-else
        :matches="{ filtered, ...matches }"
        @toggle="selected"
        @assetLoaded="assetLoaded"
        style="width: 100%"
      />
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
        lazy: false,
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
      const confidence = this.filter.confidence || 0;
      const width = this.filter.width || 0;
      const height = this.filter.height || 0;

      const filtered = files.map((file) => {
        const largest = {
          confidence: 0,
          width: 0,
          height: 0,
        };
        const names = [];
        const matches = [];
        const detectors = [];

        file.response.forEach((obj) => {
          names.push(...obj.results.map((item) => item.name));
          matches.push(...obj.results.map((item) => (item.match ? 'match' : 'miss')));
          detectors.push(obj.detector);
          obj.results.forEach((item) => {
            if (item.confidence > largest.confidence) largest.confidence = item.confidence;
            if (item.box.width > largest.width) largest.width = item.box.width;
            if (item.box.height > largest.height) largest.height = item.box.height;
          });
        });

        if (
          names.some((r) => name.includes(r)) &&
          matches.some((r) => match.includes(r)) &&
          detectors.some((r) => detector.includes(r)) &&
          largest.confidence >= confidence &&
          largest.width >= width &&
          largest.height >= height
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
  watch: {},
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
              detail: error.message,
              life: 3000,
            });
          }
        },
        async matches() {
          try {
            $this.loading.files = true;
            const id = $this.matches.source.length ? { ...$this.matches.source[0] }.id : 0;

            const { data } = await ApiService.get('match', { sinceId: id });
            setTimeout(() => {
              if (data.matches.length) $this.matches.source.unshift(...data.matches);
              $this.matches.source = $this.matches.source.slice(0, 100);
              $this.matches.selected = $this.matches.source.filter((selected) =>
                $this.matches.selected.some((filter) => filter.id === selected.id),
              );
              $this.loading.files = false;
              $this.loading.lazy = false;
            }, 1000);
          } catch (error) {
            $this.$toast.add({
              severity: 'error',
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
                  const matches = $this.matches.selected.map((obj) => ({
                    id: obj.id,
                    key: obj.file.key,
                    filename: obj.file.filename,
                  }));
                  const ids = $this.matches.selected.map((obj) => obj.id);
                  await ApiService.delete('match', matches);
                  $this.matches.disabled = $this.matches.disabled.concat(ids);
                  $this.matches.selected = [];

                  $this.toast({
                    severity: 'success',
                    detail: `${description} deleted`,
                  });
                } catch (error) {
                  $this.toast({ severity: 'error', detail: error.message });
                }
              },
            });
          } catch (error) {
            $this.toast({ severity: 'error', detail: error.message });
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
              detail: 'Folder created',
            });
          } catch (error) {
            $this.$toast.add({
              severity: 'error',
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
            const matches = $this.matches.selected.map((obj) => ({
              id: obj.id,
              key: obj.file.key,
              filename: obj.file.filename,
            }));
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
              detail: `${description} trained for ${this.trainingFolder}`,
            });
          } catch (error) {
            this.toast({
              severity: 'error',
              detail: error.message,
              life: 3000,
            });
          }
        },
      });
    },
    toast({ severity, detail }) {
      this.$toast.add({
        severity,
        detail,
        life: 3000,
      });
    },
    selected(match) {
      const { id } = match;
      if (this.matches.disabled.includes(id)) return;
      const index = this.matches.selected.findIndex((obj) => match.id === obj.id);
      if (index !== -1) this.matches.selected.splice(index, 1);
      else this.matches.selected.unshift(match);
    },
    assetLoaded(id) {
      this.matches.loaded.push(id);
    },
    toggleAll(state) {
      const available = this.filtered.filter((obj) => !this.matches.disabled.includes(obj.id)).map((obj) => obj);
      this.matches.selected = state ? available : [];
      this.toggleAllState = state;
    },
  },
};
</script>

<style scoped lang="scss"></style>
