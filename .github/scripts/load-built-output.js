#!/usr/bin/env node
//
// Loads dist/cjs via require() and dist/es via import() on whichever Node
// version invokes it -- CI runs this once per Node version it wants to
// verify. The barrel re-exports the whole graph, so loading it parses
// every module.
//
// Scoped to dist/ only, no config or "exports" map: only built formats load,
// so pruning a format needs no edit here.

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
  { dir: 'dist/@types', entry: 'index.d.ts', loader: null },
  { dir: 'dist/cjs', entry: 'index.js', loader: (path) => require(path) },
  {
    dir: 'dist/es',
    entry: 'index.js',
    loader: (path) => import(pathToFileURL(path).href),
  },
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

  for (const { dir, entry, loader } of built) {
    const path = join(root, dir, entry);

    if (!existsSync(path)) {
      console.warn(`Warning: ${dir}/ holds no ${entry} -- nothing to load`);
      continue;
    }

    console.log(`${dir}/${entry} ok`);

    if (!loader) {
      continue; // declarations (see formats above): nothing to load
    }

    const namespace = await loader(path);

    // Empty is usually a forgotten src/index.ts, though a package may legitimately
    // route everything through subpaths. The typeof guard excludes a default-only
    // barrel (`module.exports = fn`), whose Object.keys() is empty but valid.
    if (
      typeof namespace !== 'function' &&
      0 === Object.keys(namespace ?? {}).length
    ) {
      console.warn('Warning: exports nothing -- check src/index.ts');
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
