<template>
  <div class="wrapper p-pr-3 p-d-flex p-jc-between p-ai-center" ref="toolbar">
    <div class="p-as-end" style="padding-bottom: 1px"><TabMenu :model="items" /></div>
    <div v-if="version" class="version">
      <a href="https://github.com/jakowenko/double-take" target="_blank">v{{ version }}</a>
    </div>
  </div>
</template>

<script>
import TabMenu from 'primevue/tabmenu';
import ApiService from '@/services/api.service';

export default {
  components: {
    TabMenu,
  },
  data: () => ({
    version: null,
    items: [
      { label: 'Matches', icon: 'pi pi-fw fa fa-portrait', to: '/' },
      { label: 'Files', icon: 'pi pi-fw fa fa-images', to: '/files' },
      { label: 'Config', icon: 'pi pi-fw pi-cog', to: '/config' },
    ],
  }),
  async mounted() {
    try {
      const { data } = await ApiService.get('config');
      this.version = data.version;
      // eslint-disable-next-line no-empty
    } catch (error) {}
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';
.wrapper {
  height: $tool-bar-height;
  font-size: 11px;
  z-index: 5;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: $max-width;
  background: var(--surface-b);
  border-bottom: 1px solid var(--bluegray-700);
}

.version a {
  color: inherit;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

::v-deep(.p-tabmenu) .p-tabmenu-nav {
  border: none;
}

::v-deep(.p-tabmenu) .p-tabmenuitem .p-menuitem-link {
  padding: 0.55rem 1rem;
  background: none;
  border: none;
  @media only screen and (max-width: 576px) {
    padding: 0.55rem 0.55rem;
  }
}

::v-deep(.p-tabmenu) {
  font-size: 0.9rem;
  @media only screen and (max-width: 576px) {
    font-size: 0.75rem;
  }
}

::v-deep(.p-tabmenu) .p-tabmenuitem:not(.p-highlight):not(.p-disabled):hover .p-menuitem-link {
  background: none;
}

::v-deep(.p-tabmenu) .p-tabmenuitem .p-menuitem-link {
  box-shadow: 0 0 0 0 rgba(0, 0, 0, 0) !important;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
}
</style>
