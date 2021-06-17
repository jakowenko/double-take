<template>
  <div class="wrapper">
    <div class="fixed p-text-right p-pr-3">
      <Button
        icon="pi pi-refresh"
        class="p-button p-button-sm p-button-success p-mr-2"
        @click="$router.go()"
        :disabled="loading"
      />
      <Button icon="fa fa-save" class="p-button p-button-sm p-button-success" @click="save" :disabled="loading" />
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
/* eslint-disable import/no-extraneous-dependencies */
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
  data: () => ({ editor: null, code: '', ready: false, loading: false, height: `${window.innerHeight}px` }),
  async mounted() {
    try {
      this.loading = true;
      const { data } = await ApiService.get('config?format=yaml');
      this.loading = false;
      this.code = data;
      this.editor.session.setValue(data);
      this.editor.gotoPageDown();
      this.ready = true;
    } catch (error) {
      this.$toast.add({
        severity: 'error',
        detail: error.message,
        life: 3000,
      });
    }
    window.onresize = this.updateHeight;
  },
  methods: {
    async editorInit(editor) {
      this.editor = editor;
    },
    updateHeight() {
      this.height = `${window.innerHeight}px`;
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
}

.fixed {
  position: fixed;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: $max-width;
  z-index: 2;

  button {
    position: relative;
    top: 45px;
  }
}

::v-deep(.ace_editor) .ace_mobile-menu {
  display: none !important;
}
</style>
