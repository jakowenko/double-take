<template>
  <div class="wrapper p-text-center">
    <img class="icon p-d-block" :src="require('@/assets/img/icon.svg')" alt="Double Take" />
    <i v-if="loading" class="pi pi-spin pi-spinner" style="font-size: 3rem; margin-top: 25px"></i>
    <div v-else class="login-box">
      <div class="p-formgroup-inline p-d-inline-flex p-ai-center">
        <div class="p-field">
          <InputText type="password" v-model="password" placeholder="Password" @keyup.enter="login" class="p-d-block" />
          <InputText
            v-if="firstSetup"
            type="password"
            v-model="verifyPassword"
            placeholder="Confirm Password"
            @keyup.enter="login"
            class="p-d-block p-mt-1"
          />
        </div>
        <Button
          type="button"
          :label="firstSetup ? 'Create' : 'Login'"
          class="p-button-sm"
          @click="login"
          :disabled="isDisabled"
        />
      </div>
      <div v-if="firstSetup">
        <p>Please set a password</p>
        <hr />
        <p>
          To disable authentication:<br />Add <span class="code">auth:</span> <span class="code">false</span> to your
          <span class="code">config.yml</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

import ApiService from '@/services/api.service';
import Sleep from '@/util/sleep.util';

export default {
  components: {
    InputText,
    Button,
  },
  data: () => ({
    loading: false,
    firstSetup: false,
    password: null,
    verifyPassword: null,
  }),
  async mounted() {
    await this.setup();
  },
  computed: {
    isDisabled() {
      return (
        (this.firstSetup && (!this.password || !this.verifyPassword || this.password !== this.verifyPassword)) ||
        !this.password
      );
    },
  },
  methods: {
    async setup() {
      try {
        this.loading = true;
        await Sleep(250);
        const { data } = await ApiService.get('status/auth');
        this.emitter.emit('hasAuth', data.auth);
        if (data.auth === false) {
          this.$router.push('/');
          return;
        }

        if (data.jwtValid) {
          this.$router.push('/');
          return;
        }

        this.firstSetup = !data.configured;
      } catch (error) {
        this.emitter.emit('error', error);
      }
      this.loading = false;
    },
    async login() {
      try {
        if (this.isDisabled) return;
        this.loading = true;
        await Sleep(250);
        const { data } = this.firstSetup
          ? await ApiService.post('auth/password', { password: this.password })
          : await ApiService.post('auth', { password: this.password });
        localStorage.setItem('token', data.token);
        await this.$router.push('/');
        this.emitter.emit('setup');
      } catch (error) {
        error.message = error.response && error.response.status === 401 ? 'Password Incorrect' : error.message;
        this.emitter.emit('error', error);
      }
      this.loading = false;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';

.icon {
  width: 100px;
  margin: 25px auto 0 auto;
}

.login-box {
  display: inline-block;
  margin: 25px auto 0 auto;
  background: var(--surface-a);
  padding: 2rem;
  border-radius: 5px;
  max-width: 350px;
  hr {
    border-style: none;
    border-top: 1px solid var(--surface-d);
    border-bottom: 0;
  }
  .code {
    font-family: monospace;
    font-weight: bold;
  }
}

.p-field,
p {
  margin-bottom: 0;
}
p {
  font-size: 0.9rem;
}

.p-inputtext {
  font-size: 0.9rem;
  @media only screen and (max-width: 576px) {
    font-size: 16px;
  }
}
</style>
