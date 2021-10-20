import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import * as fs from 'fs';

const defaultVirtualFileId = '@virtual:plain-text/';

const plainText = (virtualFileId = defaultVirtualFileId) => {
  return {
    name: 'virtual-plain-text', // required, will show up in warnings and errors
    resolveId(id: string) {
      if (id.indexOf(virtualFileId) === 0) {
        return id;
      }
    },
    async load(id: string) {
      if (id.indexOf(virtualFileId) === 0) {
        const filePath = path.resolve(id.replace(virtualFileId, ''));
        const content = await fs.promises.readFile(filePath, {
          encoding: 'utf-8'
        });
        return `export const plainText = ${JSON.stringify(content)}`;
      }
    }
  };
};

const resolveFixup = {
  name: 'resolve-fixup',
  setup(build) {
    // NOTE: this is an example for cases where Vite cannot resolve a dependency automatically.
    //
    // build.onResolve({ filter: /react-virtualized/ }, async (args) => {
    //   return {
    //     path: path.resolve(
    //       './node_modules/react-virtualized/dist/umd/react-virtualized.js'
    //     )
    //   };
    // });
  }
};

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      plugins: [resolveFixup]
    },
    // NOTE: anything that vite forgets to bundle in node_modules/.vite when preparing dependencies goes here.
    include: [
      'chai',
      '@testing-library/react',
      '@testing-library/react/dont-cleanup-after-each'
    ]
  },
  plugins: [process.env.NODE_ENV !== 'test' ? react() : plainText()],
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd())]
    }
  }
});
