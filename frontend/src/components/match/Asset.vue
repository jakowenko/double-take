<template>
  <div class="wrapper" :class="{ disabled: disabled }">
    <Card>
      <template v-slot:header>
        <div class="match-wrapper">
          <div class="open-link">
            <i
              class="pi pi-external-link"
              @click="openLink(`${VUE_APP_API_URL}/storage/${match.file.key}?box=true`)"
            ></i>
          </div>
          <div class="selected-overlay" :class="{ selected: selected }"></div>
          <div v-if="match.box !== undefined && loaded" class="bbox" :style="box"></div>
          <img
            @click="$parent.$emit('toggle', match)"
            :class="loaded ? 'thumbnail' : 'thumbnail lazy'"
            :src="loaded ? 'data:image/jpg;base64,' + match.file.base64 : ''"
            :data-key="match.file.key"
          />
        </div>
        <div v-if="!loaded" class="p-text-center p-mt-5">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>
      </template>
      <template v-slot:title>
        <div>
          <div class="p-d-inline-flex p-ai-center">
            {{ match.name }}
            <Badge
              class="p-ml-2"
              :severity="match.match ? 'success' : 'danger'"
              :value="match.match ? 'match' : 'miss'"
            ></Badge>
          </div>
        </div>
      </template>
      <template v-slot:content>
        <Badge class="p-mt-2" v-if="match.type" :value="match.type"></Badge>
        <Badge class="p-mt-2" v-if="match.detector" :value="match.detector"></Badge>
        <Badge class="p-mt-2" v-if="match.box" :value="match.box.width + 'x' + match.box.height"></Badge>
        <Badge class="p-mt-2" v-if="match.confidence" :value="match.confidence + '%'"></Badge>
        <Badge class="p-mt-2" v-if="match.duration" :value="match.duration + ' sec'"></Badge>
      </template>
      <template v-slot:footer>
        {{ ago }}
      </template>
    </Card>
  </div>
</template>

<script>
import { DateTime } from 'luxon';
import Badge from 'primevue/badge';
import Card from 'primevue/card';

export default {
  props: {
    match: Object,
    loaded: Boolean,
    selected: Boolean,
    disabled: Boolean,
  },
  components: {
    Badge,
    Card,
  },
  data() {
    return {
      VUE_APP_API_URL: process.env.VUE_APP_API_URL,
    };
  },
  methods: {
    openLink(url) {
      window.open(url);
    },
  },
  computed: {
    box() {
      const { width, height } = this.match.file;
      const { box } = this.match;
      const values = {
        top: box.width ? `${(box.top / height) * 100}%` : 0,
        width: box.width ? `${(box.width / width) * 100}%` : 0,
        height: box.width ? `${(box.height / height) * 100}%` : 0,
        left: box.width ? `${(box.left / width) * 100}%` : 0,
      };

      return `width: ${values.width}; height: ${values.height}; top: ${values.top}; left: ${values.left}`;
    },
    ago() {
      const units = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];

      const dateTime = DateTime.fromISO(this.match.createdAt);
      const diff = dateTime.diffNow().shiftTo(...units);
      const unit = units.find((u) => diff.get(u) !== 0) || 'second';

      const relativeFormatter = new Intl.RelativeTimeFormat('en', {
        numeric: 'auto',
      });
      return relativeFormatter.format(Math.trunc(diff.as(unit)), unit);
    },
  },
};
</script>

<style scoped lang="scss">
.open-link {
  position: absolute;
  top: 0;
  right: 0;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 2;
}

.wrapper {
  transition: opacity 0.5s;

  &.disabled {
    opacity: 0.2;

    img.thumbnail {
      cursor: not-allowed;
    }
  }
}

img.thumbnail {
  width: 100%;
  display: block;
  cursor: pointer;
  transition: opacity 0.5s;

  &.lazy {
    opacity: 0;
  }
}

.match-wrapper {
  position: relative;
}

.p-badge {
  flex: 1 1 auto;
  font-size: 11px;
  margin-right: 5px;
  &:last-child {
    margin-right: 0;
  }
}

.selected-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 4px solid #78cc86;
  z-index: 2;
  display: none;
  pointer-events: none;

  &.selected {
    display: block;
  }
}

.bbox {
  z-index: 1;
  position: absolute;
  border: 2px solid #78cc86;
  pointer-events: none;
}

.p-card ::v-deep(.p-card-body) {
  @media only screen and (max-width: 576px) {
    padding: 1rem 0.75rem;
  }
}
</style>
