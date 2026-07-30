import { defineConfig } from 'tsup';
import glob from 'fast-glob';
import path from 'path';

export default defineConfig(async () => {
  const contractFiles = await glob(['prisma/contracts/**/*.{ts,d.ts}']);

  const entryObj: Record<string, string> = {};

  for (const file of contractFiles) {
    const filename = path
      .basename(file, path.extname(file))
      .replace(/\.d$/, '');
    entryObj[filename] = file;
  }

  // include enums
  entryObj['enums'] = 'prisma/generated/prisma/enums.ts';

  return {
    entry: entryObj,
    dts: {
      // generate only declaration files
      only: true,
      // hardcode all imported external/internal types
      resolve: true,
    },
    outDir: './api-contracts',
    // remove all files in the output directory before each build
    clean: true,
    // all of the dependencies will be bundled into the output file
    noExternal: [/.*/],
    outExtension() {
      return {
        dts: '.d.ts',
      };
    },
  };
});
