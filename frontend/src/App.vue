<template>
  <div id="app-wrapper">
    <div class="loading p-d-flex p-jc-center" :class="{ loaded, hidden, dark }">
      <img alt="Double Take" class="p-d-block" :src="require('@/assets/img/icon.svg')" style="width: 100px" />
    </div>
    <Toast position="bottom-left" />
    <ConfirmDialog />
    <Toolbar ref="toolbar" />
    <router-view class="router-wrapper" :class="{ visible: hidden }" :socket="socket" :toolbarHeight="toolbarHeight" />
  </div>
</template>

<script>
import { io } from 'socket.io-client';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import 'primevue/resources/primevue.min.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';

import Constants from '@/util/constants.util';
import ApiService from '@/services/api.service';
import Toolbar from '@/components/Toolbar.vue';
import '@/assets/font-awesome/css/all.min.css';

export default {
  name: 'Double Take',
  components: {
    Toast,
    ConfirmDialog,
    Toolbar,
  },
  data: () => ({
    socket: io(Constants().socket),
    toolbarHeight: null,
    loaded: false,
    dark: false,
    hidden: false,
    lastTheme: null,
  }),
  created() {
    this.getTheme();
    this.checkLoginState().then((runSetup) => {
      if (runSetup) this.setup();
    });
    window.addEventListener('focus', this.checkLoginState);
    this.emitter.on('login', this.login);
    this.emitter.on('error', (error) => this.error(error));
    this.emitter.on('toast', (...args) => this.toast(...args));
    this.emitter.on('setTheme', (theme) => this.setTheme(theme));
    this.emitter.on('setup', () => this.setup());
    this.emitter.on('appLoading', (status) => {
      this.dark = status;
      this.hidden = !status;
      this.loaded = !status;
    });
    this.addAnalytics();
  },
  mounted() {
    this.toolbarHeight = this.$refs.toolbar.getHeight();
    this.$nextTick(() => {
      setTimeout(() => {
        this.loaded = true;
      }, 250);
      setTimeout(() => {
        this.hidden = true;
      }, 250 + 350);
    });
  },
  methods: {
    async setup() {
      ApiService.get('config').then(({ data }) => {
        const { time } = data;
        localStorage.setItem('time', JSON.stringify(time));
      });
    },
    async getTheme() {
      this.$nextTick(() => {
        this.setTheme();
        ApiService.get('config/theme')
          .then(({ data }) => {
            localStorage.setItem('theme', data.theme);
            this.setTheme();
          })
          .catch((error) => {
            this.$toast.add({
              severity: 'error',
              detail: error.message,
              life: 3000,
            });
          });
      });
    },
    setTheme(newTheme) {
      const theme = newTheme || localStorage.getItem('theme');

      if (theme === this.lastTheme) return;
      if (document.getElementById('theme-link')) document.getElementById('theme-link').outerHTML = '';
      document.getElementsByTagName('body')[0].className = 'overflow-hidden';
      const themeLink = document.createElement('link');
      themeLink.setAttribute('id', 'theme-link');
      themeLink.setAttribute('rel', 'stylesheet');
      themeLink.setAttribute('type', 'text/css');
      themeLink.onload = () => {
        this.setThemeColor();
      };

      themeLink.setAttribute('href', `./themes/${theme}/theme.css`);
      localStorage.setItem('theme', theme);
      this.lastTheme = theme;

      document.getElementsByTagName('head')[0].prepend(themeLink);
      document.getElementsByTagName('body')[0].style.paddingTop = `${this.toolbarHeight}px`;
      setTimeout(() => {
        document.getElementsByTagName('body')[0].className = '';
      }, 250);
    },
    rgbToHex(r, g, b) {
      return `#${[parseInt(r, 10), parseInt(g, 10), parseInt(b, 10)]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')}`;
    },
    setThemeColor() {
      const bg = window.getComputedStyle(document.body, null).getPropertyValue('background-color');
      if (bg.includes('rgb')) {
        const [r, g, b] = bg
          .match(/\(([^)]+)\)/)[1]
          .replace(/\s+/g, '')
          .split(',');
        const hex = this.rgbToHex(r, g, b);
        const currentHex = document.getElementById('theme-color').getAttribute('content');
        if (hex !== currentHex) document.getElementById('theme-color').setAttribute('content', hex);
      }
    },
    login() {
      if (this.$route.path !== '/login') {
        this.$router.push('/logout');
      }
    },
    error(error) {
      if (error?.response?.config?.url !== 'auth' && error?.response?.status === 401) return;
      if (process.env.NODE_ENV === 'development') console.error(error);
      this.$toast.add({
        severity: 'error',
        detail: error.message,
        life: 3000,
      });
    },
    toast(opts = {}) {
      this.$toast.add({
        severity: opts.severity || 'success',
        detail: opts.message || 'Success',
        life: opts.life || 3000,
      });
    },
    async checkLoginState() {
      let runSetup = true;
      try {
        const { data } = await ApiService.get('status/auth');
        this.emitter.emit('hasAuth', data.auth);
        if (data.auth && !data.jwtValid) {
          runSetup = false;
          this.$router.push('login');
        }
        if (!data.auth && this.$route.path === '/tokens') {
          this.$router.push('/');
        }
      } catch (error) {
        runSetup = false;
        this.emitter.emit('error', error);
      }
      return runSetup;
    },
    async addAnalytics() {
      if (process.env.NODE_ENV !== 'production') return;
      ApiService.get('config')
        .then(({ data }) => {
          if (data.telemetry) {
            const analytics = document.createElement('script');
            analytics.type = 'text/javascript';
            analytics.src = './js/plausible.min.js';
            analytics.defer = true;
            analytics.setAttribute('data-domain', 'double-take-frontend');
            analytics.setAttribute('data-api', 'https://api.double-take.io/v1/plausible');
            document.head.appendChild(analytics);
          }
        })
        .catch(() => {});
    },
  },
};
</script>

<style lang="scss">
@import '@/assets/scss/_variables.scss';
html {
  font-size: 15px;
  scrollbar-width: thin;
  height: 100%;
  @media only screen and (max-width: 576px) {
    font-size: 14px;
  }
}
body {
  margin: 0;
  height: 100%;
  background: var(--surface-b);
  color: var(--text-color);

  &.overflow-hidden {
    overflow: hidden !important;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--text-color-secondary);
  border-radius: 3px;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji',
    'Segoe UI Emoji', 'Segoe UI Symbol';
  height: 100%;
}

#app-wrapper {
  min-height: 100%;
}

.loading {
  position: fixed;
  z-index: 999;
  background: rgba(0, 0, 0, 0.75);
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: opacity 0.5s;

  &.loaded {
    opacity: 0;
  }
  &.hidden {
    display: none !important;
  }
  &.dark {
    background: #20262e;
  }
}

.router-wrapper {
  opacity: 0;
  transition: opacity 0.5s;

  &.visible {
    opacity: 1;
  }
}

.p-dropdown .p-dropdown-trigger {
  width: 2rem;
}

.p-multiselect .p-multiselect-trigger {
  width: 2rem;
}

.icon.p-badge {
  display: block;
  width: 8px;
  height: 8px;
  padding: 0;
  min-width: auto;
  border-radius: 100%;
  position: relative;
}

.p-badge-secondary,
.p-button-secondary {
  background: var(--gray-200) !important;
  border-color: var(--gray-200) !important;
  color: #121212 !important;
}

.p-toast {
  z-index: 10000 !important;
}

.p-toast .p-toast-message-content {
  align-items: center;
}

.p-toast .p-toast-detail {
  margin-top: 0 !important;
}

.p-tooltip {
  max-width: 250px;
}
.p-tooltip.p-tooltip-right {
  margin-left: 3px;
}
.p-tooltip.p-tooltip-left {
  margin-left: -3px;
}
.p-tooltip.p-tooltip-top {
  margin-top: -3px;
}

.p-tooltip .p-tooltip-text {
  font-size: 0.75rem;
  padding: 0.35rem;
}

.double-take-menu {
  font-size: 0.9rem;
  width: 175px;
  margin-top: 2px;

  .p-submenu-header,
  a.p-menuitem-link {
    padding: 0.5rem 1rem;
  }

  .p-submenu-header {
    display: none;
  }

  .p-menuitem:nth-child(2) a {
    font-weight: bold;
    font-size: 0.75rem;
  }
}

@media only screen and (max-width: 576px) {
  .p-toast {
    width: auto;
    right: 20px;
  }
}

.p-dialog.p-confirm-dialog {
  max-width: 350px;
  .p-dialog-content {
    text-align: center;
  }
  .p-confirm-dialog-message {
    margin-left: 0;
  }
}

.p-multiselect-panel .p-multiselect-items {
  font-size: 0.9rem;
  @media only screen and (max-width: 576px) {
    font-size: 0.9rem;
  }
}

.p-dropdown-panel {
  font-size: 0.9rem;
  @media only screen and (max-width: 576px) {
    font-size: 0.9rem;
  }
}

.p-button-icon-only .p-button-label {
  font-size: 0;
}

i.pi-spin.pi-spinner {
  color: var(--surface-g);
}

.config-ptr--ptr,
.ptr--ptr {
  box-shadow: none !important;
  z-index: 2;

  div[class*='--box'] {
    padding-bottom: 0;
  }

  div[class*='--content'] {
    div[class*='--text'] {
      color: var(--text-color);
    }
    div[class*='--icon'] {
      color: var(--text-color);
    }
  }
}

.config-ptr--ptr {
  div[class*='--box'] {
    padding-bottom: 10px;
  }
}
</style>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';
#app-wrapper {
  max-width: $max-width;
  margin: auto;
  overflow: hidden;
}
</style>
