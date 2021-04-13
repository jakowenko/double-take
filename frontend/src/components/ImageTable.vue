<template>
  <div class="p-grid p-nogutter">
    <div v-if="files.length" class="p-col-12">
      <div class="p-grid p-ai-center">
        <div v-for="file in files" class="p-col-6 p-md-6 p-lg-4" :key="file">
          <MatchImage :file="file" @toggle="toggleSelection(file)"></MatchImage>
        </div>
      </div>
    </div>
    <div v-else class="p-col-12 p-text-center p-text-bold p-pt-5">No images found</div>
  </div>
</template>

<script>
import MatchImage from './MatchImage.vue';

export default {
  components: {
    MatchImage,
  },
  data() {
    return {
      filesSelected: 0,
    };
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
