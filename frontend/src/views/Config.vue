<template>
  <div class="config-wrapper">
    <div ref="status" class="fixed p-pt-2 p-pb-2 p-pl-3 p-pr-3">
      <div class="p-d-flex p-jc-between">
        <div class="service-wrapper p-d-flex">
          <div v-for="(service, index) in combined" :key="service.name" class="service p-d-flex p-mr-2 p-ai-center">
            <div class="name p-mr-1" v-if="index === 0" @click="copyVersion(service)" v-tooltip.right="'Copy Version'">
              {{ service.name }}
            </div>
            <div class="name p-mr-1" v-else>{{ service.name }}</div>
            <div
              v-if="service.status"
              class="icon p-badge"
              :class="service.status === 200 ? 'p-badge-success' : 'p-badge-danger'"
            ></div>
            <div v-else class="icon pulse p-badge p-badge-secondary" v-tooltip.right="'Checking...'"></div>
          </div>
        </div>
        <div class="p-d-flex">
          <Button
            icon="pi pi-copy"
            class="p-button-sm p-button-secondary p-mr-1"
            @click="copyYamlConfig"
            v-tooltip.left="'Copy Config (YAML)'"
          />
          <Button
            icon="pi pi-copy"
            class="p-button-sm p-button-secondary"
            @click="copyConfig"
            v-tooltip.left="'Copy Config (JSON)'"
          />
        </div>
      </div>
      <div class="p-d-flex p-ai-center p-mt-2 theme-holder">
        <div>
          <label class="p-d-block p-mb-1">UI Theme</label>
          <Dropdown v-model="themes.ui" :options="options.ui" class="p-mr-2" v-on:change="updateThemes(true)" />
        </div>
        <div>
          <label class="p-d-block p-mb-1">Editor Theme</label>
          <Dropdown v-model="themes.editor" :options="options.editor" v-on:change="updateThemes" />
        </div>
      </div>
      <div class="buttons p-mt-1">
        <Button
          icon="pi pi-refresh"
          class="p-button-sm p-button-success p-mb-1"
          @click="reload"
          :disabled="loading"
          v-tooltip.left="'Refresh Page'"
        />
        <br />
        <Button
          icon="fa fa-save"
          class="p-button p-button-sm p-button-success"
          @click="save"
          :disabled="loading"
          v-tooltip.left="'Save Config and Restart'"
        />
      </div>
    </div>
    <div class="editor-wrapper" :style="{ height, marginTop: this.getStatusHeight() + 'px' }">
      <div v-if="loading" class="p-d-flex p-jc-center" style="height: 100%">
        <i class="pi pi-spin pi-spinner p-as-center" style="font-size: 2.5rem"></i>
      </div>
      <VAceEditor
        v-if="themes.editor"
        v-model:value="code"
        lang="yaml"
        :wrap="true"
        :printMargin="false"
        :theme="themes.editor"
        :style="{ height, opacity: !loading ? '100%' : 0 }"
        @init="editorInit"
      />
    </div>
  </div>
</template>

<script>
import copy from 'copy-to-clipboard';

import 'ace-builds';
import 'ace-builds/webpack-resolver';

import { VAceEditor } from 'vue3-ace-editor';
import 'ace-builds/src-noconflict/mode-yaml';

import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';

import Sleep from '@/util/sleep.util';
import ApiService from '@/services/api.service';
import { version } from '../../package.json';

export default {
  components: {
    VAceEditor,
    Button,
    Dropdown,
  },
  data: () => ({
    restartCount: 0,
    services: [],
    themes: {
      ui: null,
      editor: null,
    },
    options: {
      ui: [
        'arya-purple',
        'arya-blue',
        'arya-green',
        'arya-orange',
        'bootstrap4-dark-blue',
        'bootstrap4-dark-purple',
        'bootstrap4-light-blue',
        'bootstrap4-light-purple',
        'fluent-light',
        'luna-amber',
        'luna-blue',
        'luna-green',
        'luna-pink',
        'md-dark-deeppurple',
        'md-dark-indigo',
        'md-light-deeppurple',
        'md-light-indigo',
        'mdc-dark-deeppurple',
        'mdc-dark-indigo',
        'mdc-light-deeppurple',
        'mdc-light-indigo',
        'mira',
        'nano',
        'nova',
        'nova-accent',
        'nova-alt',
        'nova-vue',
        'rhea',
        'saga-blue',
        'saga-green',
        'saga-orange',
        'saga-purple',
        'soho-light',
        'soho-dark',
        'tailwind-light',
        'vela-blue',
        'vela-green',
        'vela-orange',
        'vela-purple',
        'viva-light',
        'viva-dark',
      ],
      editor: [
        'ambiance',
        'chaos',
        'chrome',
        'clouds_midnight',
        'clouds',
        'cobalt',
        'crimson_editor',
        'dawn',
        'dracula',
        'dreamweaver',
        'eclipse',
        'github',
        'gob',
        'gruvbox',
        'idle_fingers',
        'iplastic',
        'katzenmilch',
        'kr_theme',
        'kuroir',
        'merbivore_soft',
        'merbivore',
        'mono_industrial',
        'monokai',
        'nord_dark',
        'one_dark',
        'pastel_on_dark',
        'solarized_dark',
        'solarized_light',
        'sqlserver',
        'terminal',
        'textmate',
        'tomorrow_night_blue',
        'tomorrow_night_bright',
        'tomorrow_night_eighties',
        'tomorrow_night',
        'tomorrow',
        'twilight',
        'vibrant_ink',
        'xcode',
      ],
    },
    doubleTake: {
      status: null,
      name: 'Double Take',
      version,
      buildTag: null,
    },
    frigate: {
      configured: false,
      status: null,
      name: 'Frigate',
    },
    editor: null,
    code: '',
    loading: false,
    height: 0,
  }),
  props: {
    toolbarHeight: Number,
  },
  created() {
    this.emitter.on('buildTag', (data) => {
      this.doubleTake.buildTag = data;
    });
  },
  async mounted() {
    try {
      this.loading = true;
      await this.getThemes();
      const { data } = await ApiService.get('config?format=yaml');
      this.doubleTake.status = 200;
      this.loading = false;
      this.code = data;
      this.editor.session.setValue(data);
      this.editor.session.setTabSize(2);
      this.checkDetectors();
      this.emitter.emit('getBuildTag');
      window.addEventListener('keydown', this.saveListener);
      window.addEventListener('resize', this.updateHeight);
      this.updateHeight();
    } catch (error) {
      this.doubleTake.status = error.response && error.response.status ? error.response.status : 500;
      this.emitter.emit('error', error);
    }
  },
  beforeUnmount() {
    const emitters = ['buildTag'];
    emitters.forEach((emitter) => {
      this.emitter.off(emitter);
    });
    window.removeEventListener('keydown', this.saveListener);
    window.removeEventListener('resize', this.updateHeight);
  },
  computed: {
    combined() {
      return this.frigate.configured
        ? [{ ...this.doubleTake }, { ...this.frigate }, ...this.services]
        : [{ ...this.doubleTake }, ...this.services];
    },
  },
  methods: {
    async updateThemes(reload) {
      try {
        await ApiService.patch('config/theme', { ...this.themes });
        this.emitter.emit('toast', { message: 'Theme updated' });
        if (reload === true) {
          this.loading = true;
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          return;
        }
        this.emitter.emit('setTheme', this.themes.ui);
      } catch (error) {
        this.emitter.emit('error', error);
      }
    },
    async getThemes() {
      const { data } = await ApiService.get('config?format=json');

      this.themes.editor = data.ui.editor.theme;
      this.themes.ui = data.ui.theme;
    },
    getStatusHeight() {
      return this.$refs.status?.clientHeight;
    },
    reload() {
      window.location.reload();
    },
    saveListener(event) {
      if ((event.ctrlKey || event.metaKey) && [83].includes(event.keyCode)) {
        if (!this.loading) this.save();
        event.preventDefault();
      }
    },
    formatName(name) {
      if (name === 'compreface') return 'CompreFace';
      if (name === 'deepstack') return 'DeepStack';
      if (name === 'facebox') return 'Facebox';
      return name;
    },
    async waitForRestart() {
      try {
        await Sleep(1000);
        const { data } = await ApiService.get('config');
        this.themes.editor = data.ui.editor.theme;
        this.restartCount = 0;
        this.doubleTake.status = 200;
        this.loading = false;
        this.checkDetectors();
        ApiService.get('auth/status').then(({ data: status }) => {
          this.emitter.emit('hasAuth', status.auth);
        });
        this.emitter.emit('setTheme', data.ui.theme);
        this.emitter.emit('toast', { message: 'Restart complete' });
      } catch (error) {
        if (this.restartCount < 5) {
          this.restartCount += 1;
          this.waitForRestart();
          return;
        }
        this.restartCount = 0;
        const status = error.response && error.response.status ? error.response.status : 500;
        this.doubleTake.status = status;
        this.services.forEach((service) => {
          service.status = status;
        });

        error.message = 'Restart Error: check container logs';
        this.emitter.emit('error', error);
      }
    },
    async checkFrigate(url) {
      try {
        await ApiService.get(`proxy?url=${url}/api/version`);
        this.frigate.status = 200;
      } catch (error) {
        const status = error.response && error.response.status ? error.response.status : 500;
        this.frigate.status = status;
      }
    },
    async checkDetectors() {
      const { data } = await ApiService.get('config?format=json');

      this.frigate.configured = data.frigate && data.frigate.url;
      if (this.frigate.configured) this.checkFrigate(data.frigate.url);

      this.services = data?.detectors
        ? Object.keys(data.detectors).map((item) => ({ name: this.formatName(item), status: null }))
        : [];

      if (this.services.length) {
        try {
          const { data: tests } = await ApiService.get('recognize/test');
          this.services = this.services.map((detector) => {
            const [result] = tests.filter((obj) => obj.detector.toLowerCase() === detector.name.toLowerCase());
            return {
              name: detector.name,
              status: result.status,
            };
          });
        } catch (error) {
          this.services = this.services.map((detector) => ({
            name: detector.name,
            status: 404,
          }));
        }
      }
    },
    async editorInit(editor) {
      this.editor = editor;
    },
    updateHeight() {
      this.height = `${window.innerHeight - this.getStatusHeight() - this.toolbarHeight}px`;
    },
    highlighter(code) {
      return highlight(code, languages.js);
    },
    async save() {
      try {
        if (this.loading) return;
        this.loading = true;
        await ApiService.patch('config', { code: this.code });
        this.emitter.emit('toast', { message: 'Restarting to load changes' });
        this.services.forEach((detector) => {
          delete detector.status;
        });
        delete this.doubleTake.status;
        delete this.frigate.status;
        this.waitForRestart();
      } catch (error) {
        this.loading = false;
        this.emitter.emit('error', error);
      }
    },
    copyVersion(service) {
      if (!service.version) return;
      try {
        copy(`v${service.version}:${service.buildTag}`);
        this.emitter.emit('toast', { message: 'Version copied' });
      } catch (error) {
        this.emitter.emit('error', error);
      }
    },
    async copyConfig() {
      try {
        const { data } = await ApiService.get('config?redact');
        copy(JSON.stringify(data, null, '\t'));
        this.emitter.emit('toast', { message: 'JSON config copied' });
      } catch (error) {
        this.emitter.emit('error', error);
      }
    },
    async copyYamlConfig() {
      try {
        const { data } = await ApiService.get('config?format=yaml-with-defaults');
        copy(data);
        this.emitter.emit('toast', { message: 'YAML config copied' });
      } catch (error) {
        this.emitter.emit('error', error);
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';

.config-wrapper {
  position: relative;
}

.service-wrapper {
  @media only screen and (max-width: 576px) {
    overflow-y: auto;
    // padding-bottom: 7px;
    // clip-path: inset(0 0 7px 0);
  }
}

@media only screen and (max-width: 576px) {
  .theme-holder > div {
    width: 50%;
  }
  .theme-holder > div:last-child {
    margin-left: 0.5rem;
  }
}

.p-dropdown {
  width: 150px;
  @media only screen and (max-width: 576px) {
    width: 100%;
  }
  ::v-deep(.p-inputtext) {
    font-size: 0.8rem;
  }
}

label {
  font-size: 12px;
}

.service {
  &:first-child > .name {
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
  .icon {
    top: 1px;
    @media only screen and (max-width: 576px) {
      top: 0;
    }
  }

  .icon.pulse {
    opacity: 1;
    animation: fade 1.5s linear infinite;
  }

  @keyframes fade {
    0%,
    100% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
  }

  .name {
    text-align: center;
    white-space: nowrap;
    font-size: 0.9rem;
  }
}

.fixed {
  position: fixed;
  top: $tool-bar-height;
  z-index: 5;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  background: var(--surface-b);
  max-width: $max-width;

  .buttons {
    display: inline-block;
    position: absolute;
    right: 1rem;
    top: 100%;
  }
}

::v-deep(.ace_editor) .ace_mobile-menu {
  display: none !important;
}
</style>
