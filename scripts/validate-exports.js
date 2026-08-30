const { readFileSync, existsSync } = require('node:fs');
const { dirname, join } = require('node:path');

/* ========================================================================== */
/* Setup                                                                      */
/* ========================================================================== */

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

/* ========================================================================== */
/* Path existence check                                                       */
/* ========================================================================== */

// Anything that is a string inside "exports" is a target path, whatever shape
// the map takes -- nested conditions, a flat { types, default }, a bare string
// -- so collecting the leaves covers every form without knowing any condition
// name, and cannot silently skip one it does not recognise.
const targets = (node) =>
  typeof node === 'string'
    ? [node]
    : Object.values(node ?? {}).flatMap(targets);

// Every path package.json promises a consumer: the three legacy entry fields,
// which resolvers that do not read "exports" still rely on, plus every target
// declared in the map itself.
const declared = [
  ...['main', 'module', 'types'].map((field) => pkg[field]),
  ...targets(pkg.exports),
];

// The same types file is named by both conditions of an entry, so dedupe
// before reporting -- one missing file should be one line, not two.
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

// Node decides a file's module system from the nearest package.json above it,
// which is why the build emits one into dist/cjs and dist/es. Same walk here,
// stopping one level short of the root manifest -- that one is already parsed.
function moduleSystem(path) {
  let dir = dirname(path);

  while (dir !== dirname(dir)) {
    const manifest = join(dir, 'package.json');

    if (existsSync(manifest)) {
      return JSON.parse(readFileSync(manifest, 'utf8')).type ?? 'commonjs';
    }

    dir = dirname(dir);
  }

  return packageType;
}

// A file that exists can still be the wrong kind of file. "main" is loaded by
// resolvers that ignore "exports", so it has to match the module system this
// package declares; "module" is the bundler convention for an ESM entry. Aim
// either at the other format's output and every path above still exists, while
// a plain require() of the package throws ERR_REQUIRE_ESM.
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
