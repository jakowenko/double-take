import axios from 'axios';
import VueAxios from 'vue-axios';
import { createApp } from 'vue';
import App from '@/App.vue';
import Constants from '@/util/constants.util';

const app = createApp(App);

app.use(VueAxios, axios);
app.axios.defaults.baseURL = Constants().api;
app.axios.defaults.headers.common['Content-Type'] = 'application/json';

const ApiService = {
  get(resource, params) {
    return app.axios.get(resource, { params });
  },
  post(resource, params, queryParams) {
    return app.axios.post(resource, params, queryParams);
  },
  patch(resource, params, queryParams) {
    return app.axios.patch(resource, params, queryParams);
  },
  delete(resource, params, queryParams) {
    return app.axios.delete(resource, { data: params }, queryParams);
  },
};

export default ApiService;
