import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import commonjsExternals from 'vite-plugin-commonjs-externals';
// import svgLoader from 'vite-svg-loader'
import EnvironmentPlugin from 'vite-plugin-environment';

// https://vitejs.dev/config/

const path = require('path');

const externals = ['path', /^src(\/.+)?$/];

export default defineConfig(({ command }) => ({
        plugins: [
            vue(),
    EnvironmentPlugin({DOUBLETAKE_HOST: null, DOUBLETAKE_PORT: 3000}),
    // svgLoader(),
    commonjsExternals({
      externals,
    }),
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

  },
}));
