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
    <PrismEditor class="editor" v-model="code" :highlight="highlighter"></PrismEditor>
  </div>
</template>

<script>
import Button from 'primevue/button';
import Sleep from '@/util/sleep.util';

import ApiService from '@/services/api.service';
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css';

import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';

export default {
  components: {
    PrismEditor,
    Button,
  },
  data: () => ({ code: null, loading: false }),
  async mounted() {
    try {
      this.loading = true;
      const { data } = await ApiService.get('config?format=yaml');
      this.loading = false;
      this.code = data;
    } catch (error) {
      this.$toast.add({
        severity: 'error',
        detail: error.message,
        life: 3000,
      });
    }
  },
  methods: {
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
.wrapper {
  position: relative;
}

.fixed {
  position: fixed;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 1000px;
  z-index: 2;

  button {
    position: relative;
    top: 45px;
  }
}

.editor {
  background: #2d2d2d;
  color: #ccc;
  font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 15px;
}

::v-deep(.prism-editor__textarea:focus) {
  outline: none;
}

// ::v-deep(.prism-editor__textarea) {
//   // width: 999999px !important;
// }
// ::v-deep(.prism-editor__editor) {
//   white-space: pre !important;
// }
// ::v-deep(.prism-editor__container) {
//   overflow-x: scroll !important;
// }
</style>
