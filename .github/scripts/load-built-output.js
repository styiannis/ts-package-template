#!/usr/bin/env node
//
// Loads the built output on the Node version in use -- dist/cjs with require(),
// dist/es with import() -- so CI can prove the package runs at both ends of the
// "engines" range. The barrel re-exports the whole graph, so loading it parses
// every emitted module.
//
// Its subject is dist/ and nothing else: no configuration, no "exports" map.
// Build one format and only that one is loaded, so pruning needs no edit here.

/* ========================================================================== */
/* Setup                                                                      */
/* ========================================================================== */

const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

const root = join(__dirname, '..', '..');

/* ========================================================================== */
/* Format table                                                               */
/* ========================================================================== */

// Declarations get no loader -- they do not exist at runtime.
const formats = [
  { dir: 'dist/cjs', entry: 'index.js', load: (path) => require(path) },
  {
    dir: 'dist/es',
    entry: 'index.js',
    load: (path) => import(pathToFileURL(path).href),
  },
  { dir: 'dist/@types', entry: 'index.d.ts', load: null },
];

/* ========================================================================== */
/* Load check                                                                 */
/* ========================================================================== */

async function main() {
  const built = formats.filter(({ dir }) => existsSync(join(root, dir)));

  if (built.length === 0) {
    console.error(
      `Nothing was built: none of ${formats.map((f) => f.dir).join(', ')}\n` +
        `exists. Run "npm run build" before this step.`
    );
    process.exit(1);
  }

  for (const { dir, entry, load } of built) {
    const path = join(root, dir, entry);

    if (!existsSync(path)) {
      console.warn(`warning: ${dir}/ holds no ${entry} -- nothing to load`);
      continue;
    }

    const namespace = load ? await load(path) : null;
    console.log(`${dir}/${entry} ok`);

    // An empty barrel is legitimate -- a package may route everything through
    // subpaths -- but usually means src/index.ts still has nothing to export.
    // The typeof guard matters: a default-only barrel compiles to
    // `module.exports = fn`, whose Object.keys() is empty however valid it is.
    if (
      load &&
      typeof namespace !== 'function' &&
      0 === Object.keys(namespace ?? {}).length
    ) {
      console.warn(`  warning: exports nothing -- check src/index.ts`);
    }
  }
}

/* ========================================================================== */
/* Entry point                                                                */
/* ========================================================================== */

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
