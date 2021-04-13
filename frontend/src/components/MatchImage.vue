<template>
  <div class="wrapper" :class="{ disabled: file.disabled }">
    <Card>
      <template v-slot:header>
        <div class="file-wrapper">
          <div class="open-link">
            <i class="pi pi-external-link" @click="openLink(`${VUE_APP_API_URL}/storage/${file.key}?bbox=true`)"></i>
          </div>
          <div class="selected-overlay" :class="{ selected: file.selected }"></div>
          <div v-if="file.bbox !== null && file.loaded" class="bbox" :style="file.bbox"></div>
          <img
            @click="$parent.$emit('toggle', file)"
            :class="file.loaded ? 'thumbnail' : 'thumbnail lazy'"
            :data-src="'data:image/jpg;base64,' + file.base64"
            :src="file.loaded ? 'data:image/jpg;base64,' + file.base64 : ''"
            :data-key="file.key"
          />
        </div>
        <div v-if="!file.loaded" class="p-text-center p-mt-5">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>
      </template>
      <template v-slot:title>
        <div>
          <div class="p-d-inline-flex p-ai-center">
            {{ file.name }}
            <Badge
              class="p-ml-2"
              :severity="file.match ? 'success' : 'danger'"
              :value="file.match ? 'match' : 'miss'"
            ></Badge>
          </div>
        </div>
      </template>
      <!-- <template v-slot:subtitle></template> -->
      <template v-slot:content>
        <Badge class="p-mt-2" v-if="file.type" :value="file.type"></Badge>
        <Badge class="p-mt-2" v-if="file.detector" :value="file.detector"></Badge>
        <Badge class="p-mt-2" v-if="file.dimensions" :value="file.dimensions"></Badge>
        <Badge class="p-mt-2" v-if="file.confidence" :value="file.confidence"></Badge>
        <Badge class="p-mt-2" v-if="file.duration" :value="file.duration"></Badge>
      </template>
      <template v-slot:footer>
        {{ file.ago }}
      </template>
    </Card>
  </div>
</template>

<script>
import Badge from 'primevue/badge';
import Card from 'primevue/card';

export default {
  props: {
    file: Object,
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

.wrapper.disabled {
  opacity: 0.2;

  img.thumbnail {
    cursor: not-allowed;
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

.file-wrapper {
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

.p-card ::v-deep {
  @media only screen and (max-width: 576px) {
    .p-card-body {
      padding: 1rem 0.75rem;
    }
  }
}
</style>
