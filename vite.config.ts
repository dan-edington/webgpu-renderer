import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import wasm from 'vite-plugin-wasm';
import { resolve } from 'node:path';

export default defineConfig((configEnv) => {
  const isDev = configEnv.command === 'serve';

  return {
    root: isDev ? resolve(__dirname, 'dev') : undefined,
    publicDir: resolve(__dirname, 'dev/public'),
    server: {
      open: 'index.html',
    },
    plugins: [
      dts({
        entryRoot: resolve(__dirname, 'src'),
        insertTypesEntry: true,
      }),
      wasm(),
    ],
    build: {
      outDir: resolve(__dirname, 'dist'),
      emptyOutDir: true,
      sourcemap: true,
      minify: 'oxc',
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'TonyGL',
        fileName: 'index',
        formats: ['es'],
      },
      rolldownOptions: {
        external: [],
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
      },
    },
  };
});
