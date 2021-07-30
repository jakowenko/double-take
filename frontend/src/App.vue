<template>
  <div class="wrapper">
    <Toast position="bottom-left" />
    <ConfirmDialog />
    <Toolbar />
    <router-view />
  </div>
</template>

<script>
import 'primevue/resources/themes/bootstrap4-dark-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '@/assets/font-awesome/css/all.min.css';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import Toolbar from '@/components/Toolbar.vue';

export default {
  name: 'Double Take',
  components: {
    Toast,
    ConfirmDialog,
    Toolbar,
  },
    this.emitter.on('error', (error) => this.error(error));
    this.emitter.on('toast', (...args) => this.toast(...args));
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

.p-toast .p-toast-message-content {
  align-items: center;
}

.p-toast .p-toast-detail {
  margin-top: 0 !important;
}

@media only screen and (max-width: 576px) {
  .p-toast {
    width: auto;
    right: 20px;
  }
}

.p-dialog.p-confirm-dialog {
  max-width: 500px;
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
</style>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';
.wrapper {
  max-width: $max-width;
  margin: auto;
}
</style>
