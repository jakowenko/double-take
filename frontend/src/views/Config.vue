<template>
  <div class="config-wrapper">
    <div ref="status" class="fixed p-pt-2 p-pb-2 p-pl-3 p-pr-3 p-d-flex p-jc-between">
      <div class="service-wrapper p-d-flex">
        <div v-for="(service, index) in combined" :key="service.name" class="service p-d-flex p-mr-2 p-ai-center">
          <div class="name p-mr-1" v-if="index === 0" @click="copyVersion(service)" v-tooltip.right="'Copy Version'">
            {{ service.name }}
          </div>
          <div class="name p-mr-1" v-else>{{ service.name }}</div>
          <div class="status">
            <div
              v-if="service.status"
              class="icon"
              :style="{ background: service.status === 200 ? '#78cc86' : '#c35f5f' }"
            ></div>
            <div v-else class="icon pulse" style="background: #a9a9a9" v-tooltip.right="'Checking...'"></div>
          </div>
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
      <div class="p-mr-3 buttons">
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
        v-if="theme"
        v-model:value="code"
        lang="yaml"
        :wrap="true"
        :printMargin="false"
        :theme="theme"
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
  },
  data: () => ({
    restartCount: 0,
    services: [],
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
    theme: null,
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
      this.updateHeight();
      await this.getTheme();
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
    async getTheme() {
      const { data } = await ApiService.get('config?format=json');
      this.theme = data.ui.editor.theme;
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
        this.theme = data.ui.editor.theme;
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

      if (data.frigate && data.frigate.url) {
        this.frigate.configured = true;
        this.checkFrigate(data.frigate.url);
      }

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

.service {
  &:first-child > .name {
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
  .status {
    width: 13px;
  }
  .icon {
    width: 70%;
    padding-top: 70%;
    border-radius: 100%;
    position: relative;
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
    position: absolute;
    top: 40px + 10px + 5px;
    right: 0;
  }
}

::v-deep(.ace_editor) .ace_mobile-menu {
  display: none !important;
}
</style>
