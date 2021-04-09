import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import App from './App.vue';

createApp(App).use(PrimeVue).use(ConfirmationService).use(ToastService).mount('#app');
