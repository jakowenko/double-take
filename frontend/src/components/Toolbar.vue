<template>
  <div class="tool-bar-wrapper p-pr-3 p-d-flex p-jc-between p-ai-center" ref="toolbar">
    <div><TabMenu :model="navigation" class="navigation" :class="{ show: showNavigation }" /></div>
    <div v-if="updateAvailable" class="version p-ml-auto p-mr-2" v-tooltip.left="`Update Available`">
      <div class="icon" @click="dockerHub"></div>
    </div>
    <div class="double-take-menu-wrapper p-d-flex" @click="toggleMenu">
      <i class="pi p-mr-1 pi-angle-down p-as-center" style="height: 14px; overflow: hidden"></i>
      Double Take
      <Menu
        v-if="$route.path === '/login'"
        ref="menu"
        class="double-take-menu"
        :model="hasAuth ? [{ items: [{ ...unauthorizedMenu[0].items[0] }] }] : unauthorizedMenu"
        :popup="true"
      />
      <Menu v-else ref="menu" class="double-take-menu" :model="menu" :popup="true" />
      <Dialog
        position="top"
        :modal="true"
        :closable="false"
        :draggable="false"
        :visible="password.show"
        class="change-password-dialog"
        style="min-width: 300px"
      >
        <template v-slot:header>
          <strong>Update Password</strong>
        </template>
        <label for="currentPassword" class="p-d-block p-mb-1">Current Password</label>
        <InputText id="currentPassword" type="password" v-model="password.current" class="p-d-block p-mb-2" />
        <label for="newPassword" class="p-d-block p-mb-1">New Password</label>
        <InputText id="newPassword" type="password" v-model="password.new" class="p-d-block p-mb-2" />
        <label for="verifyPassword" class="p-d-block p-mb-1">Verify Password</label>
        <InputText id="verifyPassword" type="password" v-model="password.verify" class="p-d-block" />
        <template v-slot:footer>
          <Button label="Cancel" class="p-button-text" @click="$router.push($route.path)" />
          <Button label="Yes" :disabled="isDisabled" @click="updatePassword" />
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script>
import Menu from 'primevue/menu';
import TabMenu from 'primevue/tabmenu';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import ApiService from '@/services/api.service';
import { version } from '../../package.json';

export default {
  components: {
    TabMenu,
    Menu,
    Dialog,
    Button,
    InputText,
  },
  data: () => ({
    version,
    showNavigation: false,
    updateAvailable: false,
    buildTag: null,
    hasAuth: null,
    password: {
      show: false,
      current: null,
      new: null,
      verify: null,
    },
    navigation: [
      { label: 'Matches', icon: 'pi pi-fw fa fa-portrait', to: '/' },
      { label: 'Train', icon: 'pi pi-fw fa fa-images', to: '/train' },
      { label: 'Config', icon: 'pi pi-fw pi-cog', to: '/config' },
    ],
    menu: [],
    unauthorizedMenu: [
      {
        items: [{ label: 'Logs', icon: 'pi pi-fw pi-file', to: '/logs' }],
      },
    ],
    authorizedMenu: [
      {
        items: [
          { label: 'Logs', icon: 'pi pi-fw pi-file', to: '/logs' },
          { label: 'Access Tokens', icon: 'pi pi-fw pi-key', to: '/tokens' },
          {
            label: 'Change Password',
            icon: 'pi pi-fw pi-lock',
            to: '?password',
          },
          {
            label: 'Sign Out',
            icon: 'pi pi-fw pi-power-off',
            to: '/logout',
            auth: true,
          },
        ],
      },
    ],
  }),
  created() {
    this.emitter.on('hasAuth', (data) => {
      this.hasAuth = data;
    });
    this.emitter.on('getBuildTag', () => {
      this.emitter.emit('buildTag', this.buildTag);
    });
  },
  async mounted() {
    try {
      this.showNavigation = this.$route.fullPath !== '/login';

      const obj = {
        label: `v${this.version}`,
        command: () => {
          window.open('https://github.com/jakowenko/double-take');
        },
      };

      this.authorizedMenu[0].items.unshift(obj);
      this.unauthorizedMenu[0].items.unshift(obj);
      await this.checkVersion();
      if (this.buildTag) {
        this.authorizedMenu[0].items[0].label = `v${this.version}:${this.buildTag}`;
        this.unauthorizedMenu[0].items[0].label = `v${this.version}:${this.buildTag}`;
      }
    } catch (error) {
      this.emitter.emit('error', error);
    }
  },
  computed: {
    isDisabled() {
      return (
        !this.password.current ||
        !this.password.new ||
        !this.password.verify ||
        this.password.new !== this.password.verify
      );
    },
  },
  methods: {
    getHeight() {
      return this.$refs.toolbar.offsetHeight;
    },
    async updatePassword() {
      try {
        await ApiService.patch('auth/password', { password: this.password.current, newPassword: this.password.new });
        this.$router.push('/logout');
        this.emitter.emit('toast', { message: 'Password Updated' });
        this.password.current = null;
        this.password.new = null;
        this.password.verify = null;
      } catch (error) {
        this.emitter.emit('error', error);
      }
    },
    toggleMenu(event) {
      this.$refs.menu.toggle(event);
    },
    async checkVersion() {
      if (this.version.includes('-')) {
        try {
          const sha7 = this.version.split('-')[1];
          const { data: actions } = await ApiService.get(
            'https://api.github.com/repos/jakowenko/double-take/actions/runs',
          );
          const [currentBuild] = actions.workflow_runs.filter((run) => run.head_sha.includes(sha7));
          if (currentBuild) {
            this.buildTag = currentBuild.head_branch === 'beta' ? 'beta' : 'latest';
            const [lastBuild] = actions.workflow_runs.filter((run) =>
              this.buildTag === 'latest'
                ? run.event === 'release' && run.status === 'completed' && run.conclusion === 'success'
                : run.head_branch === currentBuild.head_branch &&
                  run.status === 'completed' &&
                  run.conclusion === 'success',
            );
            if (currentBuild.id < lastBuild.id) this.updateAvailable = true;
          }
        } catch (error) {
          this.emitter.emit('error', error);
        }
        if (!this.updateAvailable) setTimeout(this.checkVersion, 60000);
      } else {
        this.buildTag = 'dev';
      }
    },
    dockerHub() {
      window.open(
        `${'https://hub.docker.com/r/jakowenko/double-take/tags?page=1&ordering=last_updated&name='}${this.buildTag}`,
      );
    },
  },
  watch: {
    hasAuth(value) {
      if (value === true) {
        this.menu = this.authorizedMenu;
        if (this.$route.query.password || this.$route.query.password === null) {
          this.password.show = true;
        }
        return;
      }
      this.menu = this.unauthorizedMenu;
    },
    $route(to) {
      this.showNavigation = to.fullPath !== '/login';
      if (this.hasAuth && (to.query.password || to.query.password === null)) {
        this.password.show = true;
        return;
      }
      this.password.show = false;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';
.tool-bar-wrapper {
  z-index: 5;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: $max-width;
  background: var(--surface-b);
  border-bottom: 1px solid var(--surface-d);
}

.navigation {
  opacity: 0;
  pointer-events: none;

  &.show {
    opacity: 1;
    pointer-events: auto;
  }
}

.change-password-dialog {
  label {
    font-size: 0.9rem;
    font-weight: bold;
  }
  input {
    width: 100%;
    @media only screen and (max-width: 576px) {
      font-size: 16px;
    }
  }
}

.icon {
  background: #dbab09;
  width: 9px;
  height: 9px;
  border-radius: 100%;
  cursor: pointer;
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

.version {
  padding-left: 5px;
}

.double-take-menu-wrapper {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  font-weight: bold;
  cursor: pointer;
}

.p-tabmenu {
  overflow: hidden;
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
    font-size: 0.85rem;
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
