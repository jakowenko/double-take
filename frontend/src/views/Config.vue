<template>
  <div class="wrapper">
    <div class="fixed p-d-flex p-jc-between p-pt-2 p-pb-2 p-pl-3 p-pr-3">
      <div class="p-d-flex p-ai-center">
        <div v-for="service in combined" :key="service.name" class="p-d-flex p-mr-3">
          <div class="p-as-center p-mr-1" style="font-size: 0.9rem">{{ service.name }}</div>
          <div
            v-if="service.status"
            class="icon p-as-center"
            :style="{ background: service.status === 200 ? '#78cc86' : '#c35f5f' }"
            v-tooltip.right="service.tooltip"
          ></div>
          <i v-if="!service.status" class="pi pi-spin pi-spinner p-as-center" style="font-size: 13px"></i>
        </div>
      </div>
      <div class="p-d-flex p-as-center">
        <Button
          icon="pi pi-refresh"
          class="p-button p-button-sm p-button-success p-mr-2"
          @click="$router.go()"
          :disabled="loading"
        />
        <Button icon="fa fa-save" class="p-button p-button-sm p-button-success" @click="save" :disabled="loading" />
      </div>
    </div>
    <VAceEditor
      v-model:value="code"
      lang="yaml"
      :wrap="true"
      :printMargin="false"
      theme="nord_dark"
      :style="{ height, opacity: ready ? '100%' : 0 }"
      @init="editorInit"
    />
  </div>
</template>

<script>
import Button from 'primevue/button';
import Sleep from '@/util/sleep.util';

import ApiService from '@/services/api.service';

import { VAceEditor } from 'vue3-ace-editor';
import 'ace-builds/src-noconflict/theme-nord_dark';
import 'ace-builds/src-noconflict/mode-yaml';

import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';

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
    },
    editor: null,
    code: '',
    ready: false,
    loading: false,
    height: `${window.innerHeight}px`,
  }),
  async mounted() {
    try {
      this.loading = true;
      const { data } = await ApiService.get('config?format=yaml');
      this.doubleTake.status = 200;
      this.loading = false;
      this.code = data;
      this.editor.session.setValue(data);
      this.editor.gotoPageDown();
      this.editor.session.setTabSize(2);
      this.ready = true;
      this.checkDetectors();
      this.updateHeight();
      window.addEventListener('keydown', this.escapeListener);
      window.addEventListener('onresize', this.updateHeight);
    } catch (error) {
      this.doubleTake.status = error.response && error.response.status ? error.response.status : 500;
      this.$toast.add({
        severity: 'error',
        detail: error.message,
        life: 3000,
      });
    }
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.escapeListener);
    window.removeEventListener('onresize', this.updateHeight);
  },
  computed: {
    combined() {
      return [{ ...this.doubleTake }, ...this.services];
    },
  },
  methods: {
    escapeListener(event) {
      if (event.key === 'Escape') {
        alert('hi');
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
        await Sleep(5000);
        await ApiService.get('config');
        this.restartCount = 0;
        this.doubleTake.status = 200;
        this.loading = false;
        this.checkDetectors();
        this.$toast.add({
          severity: 'success',
          detail: 'Restart complete',
          life: 3000,
        });
      } catch (error) {
        if (this.restartCount < 1) {
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
        this.$toast.add({
          severity: 'error',
          detail: 'Restart Error: check container logs',
          life: 10000,
        });
      }
    },
    async checkDetectors() {
      const { data } = await ApiService.get('config?format=json');
      this.services = data
        ? Object.keys(data.detectors).map((item) => ({ name: this.formatName(item), status: null }))
        : [];

      if (this.services.length) {
        try {
          const { data: tests } = await ApiService.get('recognize/test');
          this.services = this.services.map((detector) => {
            const [result] = tests.filter((obj) => obj.detector.toLowerCase() === detector.name.toLowerCase());
            let tooltip = null;
            if (typeof result.response === 'string') tooltip = result.response;
            else if (result.response && result.response.message) tooltip = result.response.message;
            else if (result.response && result.response.error) tooltip = result.response.error;
            else if (!tooltip && result.status === 404) tooltip = result.status;
            return {
              name: detector.name,
              status: result.status,
              tooltip,
            };
          });
        } catch (error) {
          this.services = this.services.map((detector) => ({
            name: detector.detector,
            status: 404,
          }));
        }
      }
    },
    async editorInit(editor) {
      this.editor = editor;
    },
    updateHeight() {
      this.height = `${window.innerHeight - 86}px`;
    },
    highlighter(code) {
      return highlight(code, languages.js);
    },
    async save() {
      try {
        this.loading = true;
        await ApiService.patch('config', { code: this.code });
        this.$toast.add({
          severity: 'success',
          detail: 'Restarting to load changes',
          life: 3000,
        });
        this.services.forEach((detector) => {
          delete detector.status;
        });
        delete this.doubleTake.status;
        this.waitForRestart();
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          detail: error.message,
          life: 3000,
        });
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/scss/_variables.scss';

.wrapper {
  position: relative;
  padding-top: 46px;
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
}

.icon {
  width: 13px;
  height: 13px;
  border-radius: 100%;
}

.ace_editor {
  background: var(--surface-a);
}

::v-deep(.ace_editor) .ace_mobile-menu {
  display: none !important;
}
</style>
