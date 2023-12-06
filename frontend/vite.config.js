import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import commonjsExternals from 'vite-plugin-commonjs-externals';
// import svgLoader from 'vite-svg-loader'
import { webpackStats } from 'rollup-plugin-webpack-stats';

// https://vitejs.dev/config/

const path = require('path');

const externals = ['path', /^src(\/.+)?$/];

export default defineConfig(({ command }) => ({
        plugins: [
            vue(),
    // svgLoader(),
    commonjsExternals({
      externals,
    }),
    // Output webpack-stats.json file
    webpackStats(),
  ],
  base: command === 'serve' ? '/' : './',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Use a supported file pattern for Vite 5/Rollup 4
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
}));
