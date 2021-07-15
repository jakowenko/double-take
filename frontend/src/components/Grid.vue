<template>
  <div class="p-grid p-nogutter">
    <div v-if="matches.filtered.length" class="p-col-12">
      <div class="p-grid p-ai-center">
        <div v-for="asset in matches.filtered" class="p-col-12 p-md-6 p-lg-4" :key="asset">
          <Asset
            :type="type"
            :asset="asset"
            :selected="matches.selected.filter((obj) => obj.id === asset.id).length === 1"
            :disabled="matches.disabled.includes(asset.id)"
            :loaded="matches.loaded.includes(asset.id)"
          />
        </div>
      </div>
    </div>
    <div v-else class="p-col-12 p-text-center p-text-bold p-pt-3 p-mt-5">No files found</div>
  </div>
</template>

<script>
import Asset from './Asset.vue';

export default {
  components: {
    Asset,
  },
  props: {
    matches: Object,
    files: Array,
    type: String,
  },
};
</script>

<style scoped lang="scss"></style>
