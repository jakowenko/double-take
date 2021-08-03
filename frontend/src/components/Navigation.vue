<template>
  <TabMenu :model="items" />
</template>

<script>
import TabMenu from 'primevue/tabmenu';

export default {
  components: {
    TabMenu,
  },
  data: () => ({
    items: [{ label: 'Matches', icon: 'pi pi-fw pi-home', to: '/matches' }],
  }),
};
</script>

<style scoped lang="scss">
::v-deep(.p-menuitem-link) {
  border-radius: 0 !important;
}
</style>
