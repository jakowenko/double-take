<template>
  <div class="config-wrapper">
    <div ref="status" class="fixed p-pt-2 p-pb-2 p-pl-3 p-pr-3" :style="'top: ' + toolbarHeight + 'px'">
      <div class="p-d-flex p-jc-between">
        <div class="service-wrapper p-d-flex">
          <div v-for="(service, index) in combined" :key="service.name" class="service p-d-flex p-pr-2 p-ai-center">
            <div
              class="name p-mr-1"
              @click="copyService(index, service)"
              v-if="service.tooltip && service.status"
              v-tooltip.right="typeof service.tooltip === 'object' ? JSON.stringify(service.tooltip) : service.tooltip"
              style="cursor: pointer"
            >
              {{ service.name }}
            </div>
            <div class="name p-mr-1" v-else>{{ service.name }}</div>
            <div
              v-if="service.status"
              class="icon p-badge"
              :class="
                service.status === 200
                  ? 'p-badge-success'
                  : service.status === 'warn'
                  ? 'p-badge-warning'
                  : 'p-badge-danger'
              "
            ></div>
            <div v-else class="icon pulse p-badge p-badge-secondary"></div>
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
        <div class="p-mr-2">
          <label class="p-d-block p-mb-1">UI Theme</label>
          <Dropdown
            v-model="themes.ui"
            :options="options.ui"
            @before-hide="updateThemes('hide', true)"
            @keyup.enter="updateThemes('enter', true)"
          />
        </div>
        <div class="p-mr-2">
          <label class="p-d-block p-mb-1">Editor Theme</label>
          <Dropdown
            v-model="themes.editor"
            :options="options.editor"
            @before-hide="updateThemes('hide')"
            @keyup.enter="updateThemes('enter')"
          />
        </div>
        <div class="p-mr-2">
          <label class="p-d-block p-mb-1">&nbsp;</label>
          <Button
            label="config.yml"
            class="p-button-sm p-button-text file-button"
            @click="changeFile('config')"
            :disabled="loading"
          />
        </div>
        <div>
          <label class="p-d-block p-mb-1">&nbsp;</label>
          <Button
            label="secrets.yml"
            class="p-button p-button-text p-button-sm file-button"
            @click="changeFile('secrets')"
            :disabled="loading"
          />
        </div>
      </div>
      <div class="buttons p-mt-1">
        <div class="p-ml-auto">
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
    </div>
    <div class="editor-wrapper" :style="{ height, marginTop: this.getStatusHeight() + 'px' }">
      <div v-if="loading" class="p-d-flex p-jc-center" style="height: 100%">
        <i class="pi pi-spin pi-spinner p-as-center" style="font-size: 2.5rem"></i>
      </div>
      <div id="pull-to-reload-message"></div>
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
import PullToRefresh from 'pulltorefreshjs';
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

import Time from '@/util/time.util';
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
    file: 'config',
    statusInterval: null,
    waitForRestart: false,
    restartTimeout: null,
    themeUpdating: false,
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
      tooltip: `v${version}`,
    },
    mqtt: {
      configured: false,
      status: null,
      name: 'MQTT',
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
    socket: Object,
  },
  created() {
    this.file = new URLSearchParams(window.location.search).get('file');
  },
  async mounted() {
    try {
      this.updateHeight();
      await this.editorData();
      this.checkStatus();
      this.checkForConfigErrors();
      this.checkDetectors();

      if (this.socket) {
        this.socket.on('connect', () => {
          if (this.waitForRestart) this.postRestart();
          this.checkForConfigErrors();
          this.doubleTake.status = 200;
        });
        this.socket.on('disconnect', () => {
          this.doubleTake.status = 500;
        });
        this.socket.on('connect_error', () => {
          this.doubleTake.status = 500;
        });
        this.doubleTake.status = this.socket.connected ? 200 : 500;
      }

      PullToRefresh.init({
        mainElement: '#pull-to-reload-message',
        triggerElement: '#app-wrapper',
        distMax: 50,
        distThreshold: 45,
        classPrefix: 'config-ptr--',
        onRefresh() {
          window.location.reload();
        },
        shouldPullToRefresh() {
          return window.scrollY === 0;
        },
      });
    } catch (error) {
      this.doubleTake.status = error.response && error.response.status ? error.response.status : 500;
      this.emitter.emit('error', error);
    }
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.saveListener);
    window.removeEventListener('resize', this.updateHeight);
    clearInterval(this.statusInterval);
    PullToRefresh.destroyAll();
  },
  computed: {
    combined() {
      const extra = [];
      if (this.mqtt.configured) extra.push(this.mqtt);
      if (this.frigate.configured) extra.push(this.frigate);

      return [{ ...this.doubleTake }, ...extra, ...this.services];
    },
  },
  methods: {
    async checkForConfigErrors() {
      ApiService.get('status/config').then(({ data: errors }) => {
        if (errors.length) this.doubleTake.status = 'warn';
        // eslint-disable-next-line no-restricted-syntax
        for (const error of errors) this.emitter.emit('toast', { severity: 'warn', message: error, life: 5000 });
      });
    },
    async editorData() {
      this.loading = true;
      await this.getThemes();
      const { data } = await ApiService.get(this.file === 'secrets' ? 'config/secrets' : 'config?format=yaml');
      this.loading = false;
      this.code = data;
      this.editor.session.setValue(data);
      this.editor.session.setTabSize(2);
      window.addEventListener('keydown', this.saveListener);
      window.addEventListener('resize', this.updateHeight);
      this.updateHeight();
    },
    changeFile(value) {
      this.file = value;
      this.$router.push({ query: { file: value } });
      this.editorData();
    },
    checkStatus() {
      this.statusInterval = setInterval(this.checkDetectors, 30000);
    },
    async updateThemes(type, reload) {
      try {
        const panelVisible = document.getElementsByClassName('p-dropdown-panel').length;
        if ((type === 'enter' && panelVisible) || this.themeUpdating) return;
        this.themeUpdating = true;
        if (reload === true) this.emitter.emit('appLoading', true);
        await Sleep(250);
        await ApiService.patch('config/theme', { ...this.themes });
        this.emitter.emit('toast', { message: 'Theme updated' });
        if (reload === true) {
          this.emitter.emit('setTheme', this.themes.ui);
          await Sleep(1000);
          this.emitter.emit('appLoading', false);
        }
        this.themeUpdating = false;
        this.updateHeight();
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
      if (name === 'rekognition') return 'Rekognition';
      return name;
    },
    async postRestart() {
      this.waitForRestart = false;
      this.loading = false;
      this.checkDetectors();
      ApiService.get('status/auth').then(({ data: status }) => {
        this.emitter.emit('hasAuth', status.auth);
      });
      this.emitter.emit('setup');
      this.emitter.emit('toast', { message: 'Restart complete' });
      this.checkStatus();
    },
    async checkFrigate() {
      try {
        this.frigate.status = null;
        await Sleep(1000);
        const { data } = await ApiService.get('status/frigate');
        this.frigate.status = 200;
        this.frigate.tooltip = `v${data.version}`;
        const { last } = data;
        if (last.time && last.camera) {
          this.frigate.tooltip += `\nLast Event: ${Time.ago(last.time)} (${last.camera})`;
        }
      } catch (error) {
        const status = error.response && error.response.status ? error.response.status : 500;
        this.frigate.tooltip = null;
        this.frigate.status = status;
      }
    },
    async checkMQTT() {
      try {
        this.mqtt.status = null;
        await Sleep(1000);
        const { data } = await ApiService.get('status/mqtt');
        this.mqtt.status = data.connected ? 200 : 500;
        this.mqtt.tooltip = data.status;
      } catch (error) {
        this.mqtt.status = 500;
        this.mqtt.tooltip = error.message;
      }
    },
    async checkDetectors() {
      const { data } = await ApiService.get('config?format=json');

      this.frigate.configured = data.frigate?.url;
      if (this.frigate.configured) this.checkFrigate();

      this.mqtt.configured = data.mqtt?.host;
      if (this.mqtt.configured) this.checkMQTT();

      this.services = [];
      if (data?.detectors) {
        // eslint-disable-next-line no-restricted-syntax
        for (const [key, value] of Object.entries(data.detectors)) {
          if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i += 1) this.services.push({ name: this.formatName(key), status: null });
          } else this.services.push({ name: this.formatName(key), status: null });
        }
      }

      if (this.services.length) {
        try {
          const { data: tests } = await ApiService.get('recognize/test');
          let previous;
          let index = 0;
          this.services = this.services.map((detector) => {
            if (previous !== detector.name) index = 0;
            const results = tests.filter((obj) => obj.detector.toLowerCase() === detector.name.toLowerCase());
            const output = {
              name: detector.name,
              tooltip: results[index].response,
              status: results[index].status,
            };
            previous = detector.name;
            index += 1;
            return output;
          });
        } catch (error) {
          this.services = this.services.map((obj) => ({ ...obj, tooltip: error.message, status: 500 }));
          this.emitter.emit('error', error);
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
        await ApiService.patch(this.file === 'secrets' ? 'config/secrets' : 'config', { code: this.code });
        this.loading = true;
        this.waitForRestart = true;
        this.emitter.emit('toast', { message: 'Restarting to load changes' });
        clearInterval(this.statusInterval);
        delete this.mqtt.status;
        delete this.frigate.status;
        this.services.forEach((detector) => {
          delete detector.status;
        });
        clearTimeout(this.restartTimeout);
        this.restartTimeout = setTimeout(() => {
          if (!this.socket.connected) {
            this.emitter.emit('error', Error('Restart Error: check container logs'));
          }
        }, 10000);
      } catch (error) {
        this.loading = false;
        this.waitForRestart = false;
        this.emitter.emit('error', error);
      }
    },
    copyService(index, service) {
      if (!service.tooltip) return;
      try {
        copy(typeof service.tooltip === 'object' ? JSON.stringify(service.tooltip, null, '\t') : service.tooltip);
        this.emitter.emit('toast', { message: index === 0 ? 'Version copied' : 'Tooltip copied' });
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
  .theme-holder > div:nth-child(3),
  .theme-holder > div:nth-child(4) {
    margin-right: 0.5rem !important;
  }
  .theme-holder > div:nth-child(1),
  .theme-holder > div:nth-child(2) {
    width: 30%;
    margin-right: 0.5rem !important;
  }
  .theme-holder > div:last-child {
    margin-right: 0;
  }
  .theme-holder ::v-deep(.p-button) {
    padding-left: 0.6rem !important;
    padding-right: 0.6rem !important;
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
    line-height: 0.9rem;
  }
}

.fixed {
  position: fixed;
  z-index: 3;
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

    .file-button {
      font-size: 0.75rem;
    }
  }
}

::v-deep(.ace_editor) .ace_mobile-menu {
  display: none !important;
}
</style>
