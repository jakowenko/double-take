<template>
  <div class="p-grid">
    <div v-if="files.length" class="p-col-12">
      <div class="p-grid p-ai-center">
        <div class="p-col-12 p-md-6 p-lg-6" v-for="file in files" :key="file">
          <MatchImage :file="file" @toggle="toggleSelection(file)"></MatchImage>
        </div>
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

<style scoped lang="scss"></style>
