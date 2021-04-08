<template>
  <div class="wrapper" :class="{ disabled: file.disabled }">
    <section class="p-d-block">
      <Badge :severity="file.match ? 'success' : 'danger'" :value="file.name"></Badge>
      <Badge :value="file.ago"></Badge>
    </section>
    <section v-if="!file.loaded" class="p-d-block p-text-center loading">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
    </section>
    <section class="p-d-block file-wrapper" :class="{ loaded: file.loaded }">
      <div class="selected-overlay" :class="{ selected: file.selected }"></div>
      <div v-if="file.bbox !== null" class="bbox" :style="file.bbox"></div>
      <img
        v-if="!file.loaded"
        @click="$parent.$emit('toggle', file)"
        class="thumbnail lazy"
        :data-src="'data:image/jpg;base64,' + file.base64"
        :data-key="file.key"
      />
      <img
        v-else
        @click="$parent.$emit('toggle', file)"
        class="thumbnail"
        :src="'data:image/jpg;base64,' + file.base64"
        :data-key="file.key"
      />
    </section>
    <section class="p-d-block">
      <Badge v-if="file.type" :value="file.type"></Badge>
      <Badge v-if="file.detector" :value="file.detector"></Badge>
      <Badge v-if="file.dimensions" :value="file.dimensions"></Badge>
      <Badge v-if="file.confidence" :value="file.confidence"></Badge>
      <Badge v-if="file.duration" :value="file.duration"></Badge>
    </section>
  </div>
</template>

<script>
import Badge from 'primevue/badge';

export default {
  props: {
    file: Object,
  },
  components: {
    Badge,
  },
};
</script>

<style scoped lang="scss">
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
}

section {
  padding: 15px 0 15px 0;
}
section.file-wrapper {
  padding-top: 0;
  padding-bottom: 0;
  position: relative;
  transition: all 0.5s;
  width: 100%;
  visibility: hidden;
  opacity: 0;

  &.loaded {
    visibility: visible;
    opacity: 1;
  }
}

.p-badge {
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
  background: rgba(123, 210, 124, 0.75);
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
  border: 2px solid rgba(123, 210, 124, 1);
  pointer-events: none;
}
</style>
