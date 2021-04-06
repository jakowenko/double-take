<template>
  <div class="file-wrapper">
    <div class="badge-wrapper">
      {{ file.disabled }}
      <div class="badge bg-primary">
        {{ file.name }}
      </div>
      <div class="badge bg-light text-dark">
        {{ file.ago }}
      </div>
    </div>
    <div v-if="!file.loaded" class="spinner-border spinner-border-sm" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <div class="image-wrapper" :class="{ disabled: file.disabled, loaded: file.loaded }">
      <div class="selected-overlay" :class="{ selected: file.selected }"></div>
      <div v-if="file.bbox !== null" class="bbox" :style="file.bbox"></div>
      <img
        v-if="!file.loaded"
        @click="$parent.$emit('toggle', file)"
        class="img-thumbnail lazy"
        :data-src="'data:image/jpg;base64,' + file.base64"
        :data-key="file.key"
      />
      <img
        v-else
        @click="$parent.$emit('toggle', file)"
        class="img-thumbnail"
        :src="'data:image/jpg;base64,' + file.base64"
        :data-key="file.key"
      />
    </div>
    <div class="badge-wrapper">
      <span v-if="file.match" class="badge bg-light text-dark">{{ file.match }}</span>
      <span v-if="file.type" class="badge bg-light text-dark">{{ file.type }}</span>
      <span v-if="file.detector" class="badge bg-light text-dark">{{ file.detector }}</span>
      <span v-if="file.dimensions" class="badge bg-light text-dark">{{ file.dimensions }}</span>
      <span v-if="file.confidence" class="badge bg-light text-dark">{{ file.confidence }}</span>
      <span v-if="file.duration" class="badge bg-light text-dark">{{ file.duration }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    file: Object,
  },
};
</script>

<style scoped lang="scss">
.badge-wrapper {
  text-align: left;

  &:first-child {
    margin-bottom: 5px;
  }
  &:last-child {
    margin-top: 5px;
  }
}

.image-wrapper {
  position: relative;
  transition: all 0.5s;
  width: 100%;
  visibility: hidden;
  opacity: 0;

  &.loaded {
    visibility: visible;
    opacity: 1;
  }

  &.disabled {
    opacity: 0.5;

    img.img-thumbnail {
      cursor: not-allowed;
    }
  }
}

img.img-thumbnail {
  width: 100%;
}

.selected-overlay {
  position: absolute;
  top: 5px;
  left: 5px;
  right: 5px;
  bottom: 5px;
  background: rgba(123, 210, 124, 0.75);
  z-index: 2;
  display: none;
  pointer-events: none;

  &.selected {
    display: block;
  }
}

.badge {
  margin-right: 5px;
  font-size: 11px;

  &:last-child {
    margin-right: 0;
  }
}

.img-thumbnail {
  cursor: pointer;
}

.bbox {
  z-index: 1;
  position: absolute;
  border: 2px solid rgba(123, 210, 124, 1);
  pointer-events: none;
}
</style>
