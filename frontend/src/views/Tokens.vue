<template>
  <div class="wrapper p-p-3">
    <div class="p-d-flex p-ai-center">
      <h1 class="p-m-0">Access Tokens</h1>
      <InputText
        type="text"
        v-model="name"
        placeholder="name"
        class="p-ml-auto p-mr-2 token-name"
        @keyup.enter="create"
      />
      <Button type="button" label="Create" class="p-button-sm p-button-success" :disabled="!name" @click="create" />
    </div>
    <p>
      Create access tokens to allow other applications to interact with your Double Take API. Tokens should be passed as
      a query string parameter in the format of <span class="code">?token=TOKEN</span>.
    </p>

    <ul v-if="tokens.length">
      <li v-for="token in tokens" :key="token" class="p-mt-3">
        {{ token.name }}
        <div class="p-d-flex p-mt-1">
          <InputText type="text" class="p-d-block" :value="token.token" readonly disabled />
          <Button class="p-button-sm p-ml-1" icon="pi pi-copy" @click="copy(token.token)" />
          <Button class="p-button-danger p-button-sm p-ml-1" icon="pi pi-trash" @click="remove(token.token)" />
        </div>
      </li>
    </ul>
    <div v-else class="p-mt-5 p-text-center">No tokens created</div>
  </div>
</template>

<script>
import copy from 'copy-to-clipboard';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import ApiService from '@/services/api.service';

export default {
  components: { Button, InputText },
  data: () => ({
    loading: false,
    tokens: [],
    name: null,
  }),
  async mounted() {
    this.get();
  },
  computed: {},
  methods: {
    async get() {
      try {
        const { data } = await ApiService.get('auth/tokens');
        this.tokens = data;
      } catch (error) {
        this.emitter.emit('error', error);
      }
    },
    async create() {
      try {
        if (!this.name) return;
        await ApiService.post('auth/tokens', { name: this.name });
        this.name = null;
        this.get();
      } catch (error) {
        this.emitter.emit('error', error);
      }
    },
    async remove(token) {
      try {
        await ApiService.delete(`auth/tokens/${token}`);
        this.emitter.emit('toast', { message: 'Token deleted' });
        this.get();
      } catch (error) {
        this.emitter.emit('error', error);
      }
    },
    copy(token) {
      try {
        copy(token);
        this.emitter.emit('toast', { message: 'Token copied' });
      } catch (error) {
        this.emitter.emit('error', error);
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';
ul {
  margin: 0;
  padding: 0;
  list-style: none;

  input {
    width: calc(100% - 70px);
  }
}

.code {
  font-family: monospace;
}

@media only screen and (max-width: 576px) {
  h1 {
    font-size: 1.35rem;
  }
}

.p-inputtext.token-name {
  @media only screen and (max-width: 576px) {
    font-size: 16px;
    max-width: 150px;
  }
}
</style>
