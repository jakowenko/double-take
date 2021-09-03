<template>
  <div class="wrapper">
    <Header
      type="match"
      :loading="loading"
      :folders="['add new', ...folders]"
      :matches="matches"
      :areAllSelected="areAllSelected"
      :stats="{ filtered: filtered.length, source: source.length }"
    />
    <div class="p-d-flex p-jc-center p-p-3">
      <i v-if="loading.files && !source.length" class="pi pi-spin pi-spinner p-mt-5" style="font-size: 3rem"></i>
      <Grid v-else type="match" :matches="{ filtered, ...matches }" style="width: 100%" />
    </div>
  </div>
</template>

<script>
import ApiService from '@/services/api.service';
import Constants from '@/util/constants.util';
import Grid from '@/components/Grid.vue';
import Header from '@/components/Header.vue';
import Sleep from '@/util/sleep.util';

export default {
  components: {
    Header,
    Grid,
  },
  data: () => ({
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
    trainingFolder: null,
    liveReload: false,
  }),
  computed: {
    source() {
      return JSON.parse(JSON.stringify(this.matches.source)).filter((obj) => obj);
    },
    areAllSelected() {
      return (
        this.filtered.length > 0 &&
        this.matches.selected.length > 0 &&
        this.matches.selected.length + this.matches.disabled.length === this.filtered.length
      );
    },
    filtered() {
      const files = JSON.parse(JSON.stringify(this.matches.source)).filter((obj) => obj);

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
      return filtered.flat().slice(0, 250);
    },
  },
  created() {
    this.emitter.on('liveReload', (value) => {
      this.liveReload = value;
    });
    this.emitter.on('filter', (value) => {
      this.filter = value;
    });
    this.emitter.on('trainingFolder', (value) => {
      this.trainingFolder = value;
    });
    this.emitter.on('assetLoaded', (...args) => this.assetLoaded(...args));
    this.emitter.on('toggleAsset', (...args) => this.selected(...args));
    this.emitter.on('reprocess', (data) => {
      this.matches.source = this.matches.source.map((obj) => (obj.id === data.id ? data : obj));
    });
  },
  async mounted() {
    await this.init();
  },
  watch: {},
  methods: {
    async init() {
      const promises = [];
      promises.push(this.get().matches());
      await Promise.all(promises);
    },
    get() {
      const $this = this;
      return {
        async matches() {
          try {
            $this.loading.files = true;
            await Sleep(1000);
            const sinceId =
              $this.liveReload && $this.matches.source.length && $this.matches.source[0]
                ? { ...$this.matches.source[0] }.id
                : 0;
            const { data } = await ApiService.get('match', { params: { sinceId } });

            if (sinceId === 0) {
              $this.matches.source = data.matches;
            } else if (data.matches.length) $this.matches.source.unshift(...data.matches);

            if (data.matches.length) {
              $this.matches.selected = $this.matches.source.filter((selected) =>
                $this.matches.selected.some((filter) => filter.id === selected.id),
              );

              const deleteDisabled = $this.matches.source.flatMap((obj, i) =>
                $this.matches.disabled.includes(obj.id) ? i : [],
              );
              for (let i = 0; i < deleteDisabled.length; i += 1) {
                delete $this.matches.source[deleteDisabled[i]];
              }
            }
            if (data.matches.length) $this.matches.disabled = [];
            $this.loading.files = false;
          } catch (error) {
            $this.emitter.emit('error', error);
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
                  await ApiService.delete('match', { data: matches });
                  const { areAllSelected } = $this;
                  $this.matches.disabled = $this.matches.disabled.concat(ids);
                  $this.matches.selected = [];
                  $this.emitter.emit('toast', { message: `${description} deleted` });

                  if (areAllSelected && !$this.liveReload) {
                    await $this.get().matches();
                  }
                } catch (error) {
                  $this.emitter.emit('error', error);
                }
              },
            });
          } catch (error) {
            $this.emitter.emit('error', error);
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
            await ApiService.post(`train/add/${this.trainingFolder}`, {
              urls: $this.matches.selected.map((obj) => `${Constants().api}/storage/${obj.file.key}`),
            });
            $this.matches.selected = [];
            $this.emitter.emit('toast', { message: `${description} trained for ${this.trainingFolder}` });
          } catch (error) {
            $this.emitter.emit('error', error);
          }
        },
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
    },
  },
};
</script>

<style scoped lang="scss"></style>
