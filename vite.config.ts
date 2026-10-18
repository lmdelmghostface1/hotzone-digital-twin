import { defineConfig, type Plugin } from 'vite';
import {
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const assetSources = [
  {
    prefix: '/reference/photos/',
    dir: path.join(rootDir, 'docs', 'reference', 'photos'),
    out: path.join(rootDir, 'dist', 'reference', 'photos')
  },
  {
    prefix: '/hmi-screens/',
    dir: path.join(rootDir, 'docs', 'HMI errors'),
    out: path.join(rootDir, 'dist', 'hmi-screens')
  }
];

function referencePhotos(): Plugin {
  return {
    name: 'reference-photos',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        const source = assetSources.find((s) => url.startsWith(s.prefix));
        if (!source) return next();
        const name = decodeURIComponent(url.slice(source.prefix.length).split('?')[0]);
        const file = path.join(source.dir, path.basename(name));
        if (!file.startsWith(source.dir) || !existsSync(file)) return next();
        res.setHeader('Content-Type', 'image/jpeg');
        createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      for (const source of assetSources) {
        if (!existsSync(source.dir)) continue;
        mkdirSync(source.out, { recursive: true });
        for (const f of readdirSync(source.dir)) {
          const src = path.join(source.dir, f);
          if (statSync(src).isFile()) copyFileSync(src, path.join(source.out, f));
        }
      }
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [referencePhotos()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200
  }
});
