const { readFileSync, existsSync } = require('node:fs');
const { dirname, join } = require('node:path');

/* ========================================================================== */
/* Setup                                                                      */
/* ========================================================================== */

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

/* ========================================================================== */
/* Path existence check                                                       */
/* ========================================================================== */

// Every string leaf in "exports" is a target path, whatever shape the map
// takes -- collecting leaves covers every condition without naming one, so
// none get silently skipped.
const targets = (node) =>
  typeof node === 'string'
    ? [node]
    : Object.values(node ?? {}).flatMap(targets);

// Every path package.json promises a consumer: the three legacy entry fields
// (for resolvers that ignore "exports") plus every target in the map.
const declared = [
  ...['main', 'module', 'types'].map((field) => pkg[field]),
  ...targets(pkg.exports),
];

// A types file is often named by both conditions of an entry, so dedupe
// before reporting -- one missing file, one line.
const missing = [...new Set(declared)].filter(
  (path) => path && !existsSync(path)
);

if (0 < missing.length) {
  throw Error(
    `Found invalid package paths\n\n${missing
      .map((path, index) => `[${index}] ${path}`)
      .join('\n')}\n`
  );
}

/* ========================================================================== */
/* Module system check                                                        */
/* ========================================================================== */

const packageType = pkg.type ?? 'commonjs';

// Node infers a file's module system from the nearest package.json above it
// -- why the build emits one into dist/cjs and dist/es. Mirror that walk
// here, stopping short of the root manifest, which is already parsed.
function moduleSystem(path) {
  let ms = packageType;
  let dir = dirname(path);

  while (dir !== dirname(dir)) {
    const manifest = join(dir, 'package.json');

    if (existsSync(manifest)) {
      ms = JSON.parse(readFileSync(manifest, 'utf8')).type ?? 'commonjs';
      break;
    }

    dir = dirname(dir);
  }

  return ms;
}

// A file can exist and still be the wrong kind. "main" is read by resolvers
// that ignore "exports", so it must match the declared module system;
// "module" is the bundler convention for an ESM entry. Point either at the
// wrong format and require() still finds a file -- just one that throws
// ERR_REQUIRE_ESM.
const mismatched = [
  ['main', packageType],
  ['module', 'module'],
].filter(
  ([field, expected]) => pkg[field] && moduleSystem(pkg[field]) !== expected
);

if (0 < mismatched.length) {
  throw Error(
    `Found entry fields pointing at the wrong module system\n\n${mismatched
      .map(([field, expected]) => `[${field}] ${pkg[field]} is not ${expected}`)
      .join('\n')}\n`
  );
}
