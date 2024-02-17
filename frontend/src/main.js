import HoneybadgerVue from "@honeybadger-io/vue"
import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';
import ToastService from 'primevue/toastservice';
import App from '@/App.vue';
import router from '@/router';
import emitter from '@/services/emitter.service';

const HBconfig = {
  apiKey: "hbp_bVwQLAvfoZQNZDuHQp1EOqqLbKn1WN07Zih5",
  environment: "production"
}

const app = createApp({
  ...App,
  strict: false,
})
  .use(router)
  .use(PrimeVue)
  .use(ConfirmationService)
  .use(ToastService)
  .use(HoneybadgerVue, HBconfig)
  .directive('tooltip', Tooltip);

app.config.globalProperties.emitter = emitter;

app.mount('#app');
