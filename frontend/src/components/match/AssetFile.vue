<template>
  <div class="wrapper">
    <Card>
      <template v-slot:header>
        <div style="position: relative">
          <img
            @click="$parent.$emit('toggle', match)"
            :class="loaded ? 'thumbnail' : 'thumbnail lazy'"
            :src="'data:image/jpg;base64,' + asset.file.base64"
            :data-key="asset.key"
            :onload="assetLoaded"
          />
          <div v-if="!loaded" style="position: absolute; top: 50%; left: 50%; margin-top: -1rem; margin-left: -1rem">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
          </div>
        </div>
      </template>
      <template v-slot:content>
        <DataTable :value="asset.results" class="p-datatable-sm" responsiveLayout="scroll">
          <Column header="Detector">
            <template v-slot:body="slotProps">
              <Badge
                :value="slotProps.data.detector"
                :severity="slotProps.data.result.status.toString().charAt(0) === '2' ? 'success' : 'danger'"
              />
            </template>
          </Column>
          <Column header="Result">
            <template v-slot:body="slotProps">
              {{ slotProps.data.result }}
            </template>
          </Column>
        </DataTable>
      </template>
      <template v-slot:footer>
        <div class="p-d-flex p-jc-between p-ai-center">
          <small>{{ createdAt.ago }}</small>
        </div>
      </template>
    </Card>
  </div>
</template>

<script>
import { DateTime } from 'luxon';
import Badge from 'primevue/badge';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

export default {
  props: {
    asset: Object,
  },
  components: {
    Badge,
    Card,
    DataTable,
    Column,
  },
  data: () => ({
    VUE_APP_API_URL: process.env.VUE_APP_API_URL,
    loaded: false,
    timestamp: Date.now(),
  }),
  created() {
    setInterval(() => {
      this.timestamp = Date.now();
    }, 1000);
  },
  methods: {
    assetLoaded() {
      this.loaded = true;
    },
    getCreatedAt(detector) {
      const [result] = this.createdAtResults.filter((obj) => obj.detector === detector);
      return result ? result.ago : 'N/A';
    },
  },
  computed: {
    createdAt() {
      const units = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];

      const dateTime = DateTime.fromISO(this.asset.createdAt);
      const diff = dateTime.diffNow().shiftTo(...units);
      const unit = units.find((u) => diff.get(u) !== 0) || 'second';

      const relativeFormatter = new Intl.RelativeTimeFormat('en', {
        numeric: 'auto',
      });
      return { ago: relativeFormatter.format(Math.trunc(diff.as(unit)), unit), timestamp: this.timestamp };
    },
    createdAtResults() {
      return this.asset.results.map((obj) => {
        const units = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];

        const dateTime = DateTime.fromISO(obj.createdAt);
        const diff = dateTime.diffNow().shiftTo(...units);
        const unit = units.find((u) => diff.get(u) !== 0) || 'second';

        const relativeFormatter = new Intl.RelativeTimeFormat('en', {
          numeric: 'auto',
        });
        return {
          detector: obj.detector,
          ago: relativeFormatter.format(Math.trunc(diff.as(unit)), unit),
          timestamp: this.timestamp,
        };
      });
    },
  },
};
</script>

<style scoped lang="scss">
::v-deep(.p-datatable-table) {
  font-size: 0.9rem;

  .p-datatable-thead > tr > th {
    border-top: 0;
  }
}

img.thumbnail {
  width: 100%;
  display: block;
  transition: opacity 0.5s;

  &.lazy {
    opacity: 0;
  }
}

.p-card {
  ::v-deep(.p-card-content) {
    padding-top: 0;
    padding-bottom: 0;
  }
  ::v-deep(.p-card-body) {
    @media only screen and (max-width: 576px) {
      padding: 0.75rem;
    }
  }
}
</style>
