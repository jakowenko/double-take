<template>
  <div class="wrapper p-pr-3 p-d-flex p-jc-between p-ai-center" ref="toolbar">
    <div class="p-as-end" style="padding-bottom: 1px"><TabMenu :model="items" /></div>
    <div v-if="version" class="version">
      <a
        href="https://hub.docker.com/repository/docker/jakowenko/double-take/tags?page=1&ordering=last_updated"
        target="_blank"
        class="update"
        :class="{ visible: updateAvailable }"
      >
        <div v-tooltip.left="'Update Available'" class="icon p-d-inline-block p-mr-1"></div>
      </a>
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
    updateAvailable: false,
    items: [
      { label: 'Matches', icon: 'pi pi-fw fa fa-portrait', to: '/' },
      { label: 'Train', icon: 'pi pi-fw fa fa-images', to: '/train' },
      { label: 'Config', icon: 'pi pi-fw pi-cog', to: '/config' },
    ],
  }),
  async mounted() {
    try {
      const { data } = await ApiService.get('config');
      this.version = data.version;
      this.checkVersion();
      // eslint-disable-next-line no-empty
    } catch (error) {}
  },
  methods: {
    async checkVersion() {
      if (this.version.includes('-')) {
        try {
          const sha7 = this.version.split('-')[1];
          const { data: actions } = await ApiService.get(
            'https://api.github.com/repos/jakowenko/double-take/actions/runs',
          );
          const [currentBuild] = actions.workflow_runs.filter((run) => run.head_sha.includes(sha7));
          if (currentBuild) {
            const [lastBuild] = actions.workflow_runs.filter(
              (run) =>
                run.head_branch === currentBuild.head_branch &&
                run.status === 'completed' &&
                run.conclusion === 'success',
            );
            if (currentBuild.id < lastBuild.id) this.updateAvailable = true;
          }
          // eslint-disable-next-line no-empty
        } catch (error) {}
        if (!this.updateAvailable) setTimeout(this.checkVersion, 60000);
      }
    },
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

.icon {
  background: #dbab09;
  width: 9px;
  height: 9px;
  border-radius: 100%;
}
a.update {
  opacity: 0;
  transition: opacity 0.5s;
  pointer-events: none;
  user-select: none;
}
a.update.visible {
  opacity: 1;
  pointer-events: auto;
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
