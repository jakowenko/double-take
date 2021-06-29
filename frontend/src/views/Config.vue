<template>
  <div class="wrapper">
    <div class="fixed p-d-flex p-jc-between p-pt-2 p-pb-2 p-pl-3 p-pr-3">
      <div class="p-d-inline-flex p-as-center">
        <div v-for="detector in detectors" :key="detector.detector" class="p-d-inline-block p-mr-2">
          <Badge
            v-tooltip.right="detector.status === 200 ? 'Working' : detector.response"
            :value="detector.detector"
            :severity="detector.status === 200 ? 'success' : detector.status === null ? 'info' : 'danger'"
          />
        </div>
      </div>
      <div class="p-d-inline-flex p-as-center">
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
import Badge from 'primevue/badge';
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
    Badge,
  },
  data: () => ({
    detectors: null,
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
      this.loading = false;
      this.code = data;
      this.editor.session.setValue(data);
      this.editor.gotoPageDown();
      this.editor.session.setTabSize(2);
      this.ready = true;
    } catch (error) {
      this.$toast.add({
        severity: 'error',
        detail: error.message,
        life: 3000,
      });
    }

    this.checkDetectors();
    this.updateHeight();
    window.onresize = this.updateHeight;
  },
  methods: {
    async checkDetectors() {
      const { data } = await ApiService.get('config?format=json');
      this.detectors = data
        ? Object.keys(data.detectors).map((item) => ({ detector: item, status: null, response: 'Checking...' }))
        : null;
      if (this.detectors.length) {
        try {
          const { data: tests } = await ApiService.get('recognize/test');
          this.detectors = this.detectors.map((detector) => {
            const [result] = tests.filter((obj) => obj.detector === detector.detector);
            return {
              detector: detector.detector,
              status: result.status,
            };
          });
        } catch (error) {
          this.detectors = this.detectors.map((detector) => ({
            detector: detector.detector,
            status: 404,
          }));
        }
      }
    },
    async editorInit(editor) {
      this.editor = editor;
    },
    updateHeight() {
      this.height = `${window.innerHeight - 40}px`;
    },
    highlighter(code) {
      return highlight(code, languages.js);
    },
    async save() {
      try {
        this.loading = true;
        await Sleep(1000);
        await ApiService.patch('config', { code: this.code });
        this.loading = false;
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

.ace_editor {
  background: var(--surface-a);
}

::v-deep(.ace_editor) .ace_mobile-menu {
  display: none !important;
}
</style>
