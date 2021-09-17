<template>
  <div v-show="matches.source.length" class="p-p-3">
    <div class="p-grid p-nogutter">
      <div class="p-col-12">
        <div class="p-grid p-ai-center">
          <div v-for="(asset, index) in matches.source" class="p-col-12 p-sm-6 p-md-4 p-lg-3" :key="asset">
            <Asset
              :type="type"
              :asset="asset"
              :folders="folders"
              :selected="matches.selected.includes(asset.id)"
              :disabled="matches.disabled.includes(asset.id)"
              :loaded="matches.loaded.includes(asset.id)"
              :index="index"
            />
          </div>
        </div>
      </div>
    </div>
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
    folders: Array,
  },
};
</script>

<style scoped lang="scss"></style>
