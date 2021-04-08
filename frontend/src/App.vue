<template>
  <div class="wrapper p-pl-3 p-pr-3">
    <Toast />
    <ConfirmDialog />
    <Manage />
  </div>
</template>

<script>
import 'primevue/resources/themes/bootstrap4-dark-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import Manage from '@/views/Manage.vue';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

export default {
  name: 'App',
  components: {
    Manage,
    Toast,
    ConfirmDialog,
  },
  data() {
    return {
      info: null,
    };
  },
};
</script>

<style lang="scss">
html {
  font-size: 15px;
}
body {
  margin: 0;
  background: var(--surface-b);
  color: var(--text-color);
}
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
@media only screen and (max-width: 576px) {
  .p-toast {
    width: auto;
    left: 20px;
  }
}
</style>

<style scoped lang="scss">
.wrapper {
  max-width: 1000px;
  margin: auto;
  background: var(--surface-a);
}
</style>
