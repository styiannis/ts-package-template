# TypeScript Package Template

![Static Badge](https://img.shields.io/badge/Node.js-ffffff?style=flat-square&logo=nodedotjs)
![Static Badge](https://img.shields.io/badge/JavaScript-ffffff?style=flat-square&logo=javascript)
![Static Badge](https://img.shields.io/badge/TypeScript-ffffff?style=flat-square&logo=typescript)
![Static Badge](https://img.shields.io/badge/Rollup.js-ffffff?style=flat-square&logo=rollup.js)
![Static Badge](https://img.shields.io/badge/Jest-ffffff?style=flat-square&logo=jest&logoColor=c21325)
![Static Badge](https://img.shields.io/badge/Oxlint-ffffff?style=flat-square&logo=oxc)
![Static Badge](https://img.shields.io/badge/Prettier-ffffff?style=flat-square&logo=prettier)

A template for publishing TypeScript packages whose **source hierarchy survives into the build** — so consumers can import one deep submodule instead of your whole barrel.

Zero runtime dependencies. CommonJS, ESM and type declarations from a single source tree.

Your sources on the left, what a consumer installs on the right:

```
src/                  dist/es/            dist/cjs/ and dist/@types/
├── index.ts       →  ├── index.js        mirror the same shape
└── shapes/           └── shapes/         (.js and .d.ts)
    ├── index.ts          ├── index.js
    └── circle.ts         └── circle.js
```

Every emitted module keeps its path, so every module can be its own entry point:

```ts
import { hello } from 'my-package'; // the barrel
import { Circle } from 'my-package/circle'; // one module, nothing else
```

```js
const { Circle } = require('my-package/circle'); // same subpath, CommonJS
```

Declared entry points are **checked, not assumed**: `npm run verify` builds, then confirms every path `package.json` promises actually landed in `dist/`.

Mixed `.ts`/`.js` sources build, type-check and test side by side, so a JavaScript package can migrate incrementally.

## System Requirements

| Package     | Version     |
| ----------- | ----------- |
| **Node.js** | ≥ `18.12.0` |
| **npm**     | ≥ `8.0.0`   |

Node ≥ `22.12.0` is recommended for development (declared in `devEngines`, warning only).

## Getting Started

Either click the "_Use this template_" button at the top of the repository and clone the result, or clone this repository directly:

```sh
git clone https://github.com/styiannis/ts-package-template my-package
cd my-package
npm install
npm run verify
```

A green `verify` means it type-checks, lints, builds, and every declared entry point really landed.

### First Steps After Using the Template

Everything under `src/` and `tests/` is placeholder demo code. To make the template yours:

1. **Delete the demo code** — `src/module-a/`, `src/module-b/` and the three files in `tests/`. Write your own modules and re-export them from `src/index.ts`.
2. **Replace the `exports` map** — the 8 demo entries in `package.json` describe the demo modules. See [Adding a public module](#adding-a-public-module).
3. **Update the metadata** — `name`, `version`, `description`, `keywords`, `author`, `license`, plus `repository` and `bugs` so they point at your own repository and issue tracker. Replace the copyright line in `LICENSE` too.
4. **Commit your lockfile** — the template gitignores `package-lock.json`, `yarn.lock` and `pnpm-lock.yaml` so no derived project inherits a foreign dependency tree or package manager choice. Your project is not a template: remove your package manager's lockfile from `.gitignore`, run `npm install`, and commit the result so your builds are reproducible.
5. **Rewrite this README** to describe your package.

## Adding a Public Module

Every publicly importable module is declared by hand in the `exports` map of `package.json`. Adding one is three steps:

**1.** Create the file under `src/`, and re-export it from `src/index.ts` if it also belongs in the barrel.

**2.** Add a matching block to `exports`:

```json
"./my-module": {
  "import": {
    "types": "./dist/@types/path/to/my-module.d.ts",
    "default": "./dist/es/path/to/my-module.js"
  },
  "require": {
    "types": "./dist/@types/path/to/my-module.d.ts",
    "default": "./dist/cjs/path/to/my-module.js"
  }
}
```

`types` must stay first inside each condition — conditions are matched in order.

**3.** Run `npm run build && npm run validate-exports`.

> **The subpath is a name you choose, not the file path.** The demo map deliberately flattens: `./submodule-a1` resolves to `dist/*/module-a/submodule-a1.js`. Consumers type the subpath, so pick what reads well and keep the three paths inside the block consistent with the actual file location.

> **A module that only re-exports other modules gets no file of its own**, so it cannot be an entry point — the build drops modules that contribute nothing themselves. That is why the demo map declares `./module-a` but not `./module-b`, whose `index.ts` is pure re-exports.

[`validate-exports`](scripts/validate-exports.js) reads the map you just edited and checks that every path it names exists in `dist/`. That catches the mistake this map invites: an entry pointing at a file the build never produced — a typo, a renamed source file, a module the build dropped, or a subpath added before the module behind it.

It checks `main`, `module` and `types` the same way, plus one thing existence cannot catch: that `main` and `module` name the right _kind_ of file — `main` the format your package declares, `module` an ESM one. Modern Node resolves through `exports` and ignores all three fields, so a broken one stays invisible until it reaches a consumer who does not: an older bundler, or TypeScript on `moduleResolution: "node"`.

It is a **path check** — it confirms the files are there, not that they import cleanly.

## Choosing Which Formats to Build

All three formats are built by default. Set `BUILD_FORMATS` to a comma-separated subset of `cjs`, `es`, `types` to build fewer:

```sh
BUILD_FORMATS=es,types npm run build    # ESM-only package
BUILD_FORMATS=cjs,types npm run build   # CommonJS-only package
```

An unknown format name or an empty list fails the build with a clear message, rather than silently producing nothing.

To set it permanently, copy `.env.example` to `.env` and edit it — the `.env` file is gitignored and optional, so nothing breaks if it is absent. An inline `BUILD_FORMATS=... npm run build` always overrides it.

`npm run validate-exports` does not look at `BUILD_FORMATS` at all — it tries every path `package.json` declares against whatever is actually in `dist/`, regardless of which subset you built. If you settle on a format subset permanently, prune `package.json` to match. Drop the matching conditions from the `exports` map, then drop the entry fields whose format you no longer build:

| Field    | Belongs to    | Keep it when you build |
| -------- | ------------- | ---------------------- |
| `main`   | `dist/cjs`    | `cjs`                  |
| `module` | `dist/es`     | `es`                   |
| `types`  | `dist/@types` | `types`                |

Otherwise `verify` legitimately fails on the formats you told it not to build. Once you do, the CI steps follow along on their own: they load whatever the build actually produced.

> **Delete the field — do not repoint it.** For an ESM-only package, `main: "dist/es/index.js"` looks like the obvious fix and is a trap: `main` is what resolvers that ignore `exports` follow, and they load it as CommonJS, so a plain `require()` of your package throws `ERR_REQUIRE_ESM`. An ESM-only package has no `main` — `module` and `exports` are the ESM entry points. `validate-exports` fails on this, since the file exists and only its module system is wrong. (If you genuinely want the whole package to be ESM, set `"type": "module"` at the top level of `package.json`; then `main` may point at ESM, and the check follows.)

## Package Scripts

| Script                | What it does                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `build`               | Clean `dist/` and build the configured formats into `dist/cjs`, `dist/es`, `dist/@types`                       |
| `dev`                 | The same build, in watch mode                                                                                  |
| `test`                | Run the test suite once                                                                                        |
| `test-watch`          | Run tests in watch mode                                                                                        |
| `test-coverage`       | Run tests and write a coverage report to `coverage_report/`                                                    |
| `test-coverage-watch` | Coverage, in watch mode                                                                                        |
| `check-types`         | Type-check without emitting files                                                                              |
| `lint`                | Run code quality checks over `src/`                                                                            |
| `format`              | Format the repository with Prettier                                                                            |
| `docs`                | Generate API documentation into `code_documentation/`                                                          |
| `check-updates`       | Report outdated dependencies                                                                                   |
| `validate-exports`    | Check that every path `package.json` declares — `exports`, `main`, `module`, `types` — exists in the build     |
| `verify`              | Everything needed before a commit or release: `check-types` → `lint` → `build` → `validate-exports`            |
| `prepack`             | Install and build before packing — runs automatically on `npm pack` and `npm publish`                          |
| `clear`               | Remove generated directories: `build/` <sup>**(\*)**</sup>, `code_documentation/`, `coverage_report/`, `dist/` |
| `reset`               | `clear`, plus `node_modules/`                                                                                  |
| `reset-hard`          | `reset`, plus every lockfile <sup>**(\*\*)**</sup>                                                             |

<sup>**(\*)**</sup> _`build/` is the scratch output directory for a bare `tsc` run, separate from the final build artifacts in `dist/`._

<sup>**(\*\*)**</sup> _Safe while the lockfiles are untracked, as they are in this template. Once you commit yours (step 4 above), prefer plain `reset` in your own checkout._

## Configuration Files

| File                             | Purpose                                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `package.json`                   | Project metadata, dependencies, scripts and the `exports` map. See [npm docs](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)                         |
| `tsconfig.json`                  | TypeScript compiler settings for type checking and builds. See [TSConfig docs](https://www.typescriptlang.org/tsconfig)                                            |
| `rollup.config.mjs`              | Build configuration — generates the CommonJS/ESM/Types outputs. See [Rollup docs](https://rollupjs.org/configuration-options)                                      |
| `.env.example`                   | Template for an optional, gitignored `.env` that selects which formats the build produces. See [Choosing Which Formats to Build](#choosing-which-formats-to-build) |
| `jest.config.js`                 | Test runner setup with TypeScript support. See [Jest docs](https://jestjs.io/docs/configuration)                                                                   |
| `.prettierrc`, `.prettierignore` | Formatting rules and the paths excluded from them. See [Prettier docs](https://prettier.io/docs/en/configuration)                                                  |
| `.gitignore`                     | Version control ignore patterns. See [gitignore docs](https://git-scm.com/docs/gitignore)                                                                          |

## Continuous Integration

The **Verify** workflow ([.github/workflows/verify.yml](.github/workflows/verify.yml)) runs as a single job that switches Node versions between steps:

- **Node 22** — installs dependencies, runs `npm run verify`, then `npm run test-coverage`.
- **Node 18** and **Node 24** — the ends of the `engines` range. Each runs [load-built-output.js](.github/scripts/load-built-output.js) against the same `dist/` built above: `dist/cjs/index.js` with `require()`, `dist/es/index.js` with `import()`, plus a presence check on `dist/@types/index.d.ts`.

What it loads is decided by what is in `dist/`, so it needs no configuration: build one format and only that one is loaded; build all three and all three are checked. The step fails when none of the three directories exists, which is what a `dist/` nobody built looks like. It warns instead of failing in two softer cases — a directory that exists without its entry file, and a barrel that loads but exports nothing, which is usually the gap between deleting the demo code and writing your own.

Loading the barrel parses and executes every emitted module, so these steps genuinely exercise the `engines` range: a syntax level or runtime API your build emits but Node 18 does not accept fails here.

The workflow is **manual-dispatch only** — start it from the "_Actions_" tab. Pushes and pull requests do not trigger it, so run `npm run verify` locally before committing.

**Running it automatically.** A published package usually wants this on every pull request. Add the triggers you need alongside the existing one:

```yaml
on:
  workflow_dispatch:
  pull_request:
  push:
    branches: [main]
```

Nothing else has to change. Scope `push` narrowly — `[main]` above, not every branch — so you are not paying for a full install and build on every commit anywhere.

## Publishing

`package.json` ships only `dist/` (its `files` field), so the tarball carries the build and nothing else — no sources, no tests, no config. `prepack` runs `npm i && npm run build` automatically, so `npm publish` always packs a fresh build instead of whatever `dist/` happened to hold.

```sh
npm run verify        # type-check, lint, build, check declared paths
npm pack --dry-run    # list exactly what would be published
npm publish
```

A scoped name (`@you/my-package`) publishes privately by default and fails without a paid account. To publish it publicly:

```json
"publishConfig": {
  "access": "public"
}
```

## Issues and Support

If you encounter any issues or have questions, please open an issue on the [GitHub Issue Tracker](https://github.com/styiannis/ts-package-template/issues).

## License

This project is licensed under the [MIT License](https://github.com/styiannis/ts-package-template?tab=MIT-1-ov-file#readme).
