import { readdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const devDir = dirname(fileURLToPath(import.meta.url));
const exclude = new Set(['public', 'node_modules']);

async function getDevFolders() {
  const entries = await readdir(devDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !exclude.has(entry.name) && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export function devFoldersPlugin() {
  return {
    name: 'dev-folders-plugin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url !== '/dev-folders') {
          next();
          return;
        }

        try {
          const folders = await getDevFolders();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(folders));
        } catch {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Failed to read dev folders' }));
        }
      });
    },
  };
}
