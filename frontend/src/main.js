import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import App from './App.vue';
import router from './router';

createApp(App).use(router).use(PrimeVue).use(ConfirmationService).use(ToastService).mount('#app');
