<template>
  <div class="container p-0">
    <div v-if="files.length" class="files-wrapper">
      <div class="file-col" v-for="file in files" :key="file">
        <MatchImage :file="file" @toggle="toggleSelection(file)"></MatchImage>
      </div>
    </div>
    <div v-else>No images found</div>
  </div>
</template>

<script>
import MatchImage from './MatchImage.vue';

export default {
  data() {
    return {
      filesSelected: 0,
    };
  },
  components: {
    MatchImage,
  },
  props: {
    files: Array,
  },
  mounted() {
    this.$nextTick(() => {
      this.$emit('files-rendered');
    });
  },
};
</script>

<style scoped lang="scss">
.container {
  overflow: hidden;
}

.files-wrapper {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}

.file-col {
  width: 49%;
  margin-right: 2%;
  padding: 0;
  flex-direction: column;
  padding-top: 25px;

  &:nth-child(-n + 2) {
    padding-top: 0;
  }

  &:nth-child(even) {
    margin-right: 0;
  }

  img.img-thumbnail {
    width: 100%;
  }
}
</style>
