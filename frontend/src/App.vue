<template>
  <div class="app-wrapper">
    <Toast position="bottom-left" />
    <ConfirmDialog />
    <Toolbar ref="toolbar" />
    <router-view :socket="socket" :toolbarHeight="toolbarHeight" />
  </div>
</template>

<script>
import io from 'socket.io-client';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import 'primevue/resources/themes/bootstrap4-dark-blue/theme.css';
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
  }),
  created() {
    this.checkLoginState();
    window.addEventListener('focus', this.checkLoginState);
    this.emitter.on('login', this.login);
    this.emitter.on('error', (error) => this.error(error));
    this.emitter.on('toast', (...args) => this.toast(...args));
  },
  mounted() {
    this.toolbarHeight = this.$refs.toolbar.getHeight();
  },
  methods: {
    login() {
      if (this.$route.path !== '/login') {
        this.$router.push('/logout');
      }
    },
    error(error) {
      if (error.response && error.response.config.url !== 'auth' && error.response.status === 401) return;
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
        life: 3000,
      });
    },
    async checkLoginState() {
      const { data } = await ApiService.get('auth/status');
      this.emitter.emit('hasAuth', data.auth);
      if (data.auth && !data.jwtValid) {
        this.$router.push('login');
      }
      if (!data.auth && this.$route.path === '/tokens') {
        this.$router.push('/');
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/assets/scss/_variables.scss';
html {
  font-size: 15px;
  @media only screen and (max-width: 576px) {
    font-size: 14px;
  }
}
body {
  margin: 0;
  background: var(--surface-b);
  color: var(--text-color);
  padding-top: $tool-bar-height;
}
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji',
    'Segoe UI Emoji', 'Segoe UI Symbol';
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
}

.p-button-icon-only .p-button-label {
  font-size: 0;
}
</style>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';
.app-wrapper {
  max-width: $max-width;
  margin: auto;
  overflow: hidden;
}
</style>
