<template>
  <div class="p-grid p-nogutter">
    <div v-if="matches.filtered.length" class="p-col-12">
      <div class="p-grid p-ai-center">
        <div v-for="match in matches.filtered" class="p-col-12 p-md-6 p-lg-6" :key="match">
          <Asset
            :match="match"
            :selected="matches.selected.filter((obj) => obj.id === match.id).length === 1"
            :disabled="matches.disabled.includes(match.id)"
            :loaded="matches.loaded.includes(match.id)"
          />
        </div>
      </div>
    </div>
    <div v-else class="p-col-12 p-text-center p-text-bold p-pt-5">No matches found</div>
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
  },
};
</script>

<style scoped lang="scss"></style>
