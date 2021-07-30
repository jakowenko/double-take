import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';
import ToastService from 'primevue/toastservice';
import App from '@/App.vue';
import router from '@/router';
import emitter from '@/services/emitter.service';

const app = createApp(App)
  .use(router)
  .use(PrimeVue)
  .use(ConfirmationService)
  .use(ToastService)
  .directive('tooltip', Tooltip);

app.config.globalProperties.emitter = emitter;
app.mount('#app');
