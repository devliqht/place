import * as esbuild from 'esbuild';
import { readdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getAllEntryPoints(dir) {
  const entries = [];
  const files = await readdir(dir, { withFileTypes: true, recursive: true });

  for (const file of files) {
    if (file.isFile() && file.name.endsWith('.ts')) {
      const fullPath = join(file.path || file.parentPath, file.name);
      entries.push(fullPath);
    }
  }

  return entries;
}

async function build() {
  try {
    const entryPoints = await getAllEntryPoints('./src');

    await esbuild.build({
      entryPoints,
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outdir: 'dist',
      outbase: 'src',
      sourcemap: true,
      packages: 'external',
      tsconfig: './tsconfig.json',
      alias: {
        '@': resolve(__dirname, 'src'),
        '@/config': resolve(__dirname, 'src/config'),
        '@/routes': resolve(__dirname, 'src/routes'),
        '@/middleware': resolve(__dirname, 'src/middleware'),
        '@/services': resolve(__dirname, 'src/services'),
        '@/sockets': resolve(__dirname, 'src/sockets'),
        '@/utils': resolve(__dirname, 'src/utils'),
        '@/types': resolve(__dirname, 'src/types'),
      },
    });

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
