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

Declared entry points are **checked, not assumed**: `npm run verify` builds, then confirms every path `package.json` promises landed in `dist/` — and that what landed actually loads.

Mixed `.ts`/`.js` sources build, type-check and test side by side, so a JavaScript package can migrate incrementally.

## What It Does Not Do

Plumbing, not policy: no git hooks, no commit-message rules, no CI that blocks a push. The linter and formatter ship with defaults, not opinions you are expected to keep. A fresh clone needs Node and npm and nothing else — the peripheral tools run on demand rather than taking a dependency slot.

What it does enforce is narrow and mechanical: every entry point your package declares has to exist in the build, in the right module format, and load on the Node versions you claim to support. Those checks and the workflow around them are described below — few, but they hold. The cost is honest: no safety net, and nothing runs unless you run it.

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

A green `verify` means it type-checks, lints, builds, and every declared entry point really landed and loads.

### First Steps After Using the Template

Everything under `src/` and `tests/` is placeholder demo code, named `module-a`/`module-b` rather than the illustrative `shapes/` of the diagram above. To make the template yours:

1. **Delete the demo code** — `src/module-a/`, `src/module-b/` and the three files in `tests/`. Write your own modules and re-export them from `src/index.ts`.
2. **Replace the `exports` map** — the 8 demo entries in `package.json` describe the demo modules. See [Adding a public module](#adding-a-public-module).
3. **Update the metadata** — `name`, `version`, `description`, `keywords`, `author`, `license`, plus `repository` and `bugs` so they point at your own repository and issue tracker. Replace the copyright line in `LICENSE` too.
4. **Commit your lockfile** — the template gitignores `package-lock.json`, `yarn.lock` and `pnpm-lock.yaml` so no derived project inherits a foreign dependency tree or package manager choice. Your project is not a template: remove your package manager's lockfile from `.gitignore`, run `npm install`, and commit the result so your builds are reproducible.
5. **Rewrite this README** to describe your package.

> **Two demo modules are `.js` on purpose** — the mixed-source build, made concrete; worth a look before step 1 removes them. The support is configuration rather than demo code: `allowJs` in `tsconfig.json` and the `js-with-ts` preset in `jest.config.cjs`, neither touched by that step.

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

**3.** Run `npm run build && npm run check-declared-paths`.

> **The subpath is a name you choose, not the file path.** The demo map deliberately flattens: `./submodule-a1` resolves to `dist/*/module-a/submodule-a1.js`. Consumers type the subpath, so pick what reads well and keep the three paths inside the block consistent with the actual file location.

> **A module that only re-exports other modules gets no file of its own**, so it cannot be an entry point — the build drops modules that contribute nothing themselves. That is why the demo map declares `./module-a` but not `./module-b`, whose `index.ts` is pure re-exports.

[`check-declared-paths`](scripts/check-declared-paths.cjs) reads the map you just edited and checks that every path it names exists in `dist/`, catching the mistake this map invites: an entry pointing at a file the build never produced — a typo, a renamed source file, a module the build dropped, or a subpath added before the module behind it. It checks the legacy `main`, `module` and `types` fields the same way, plus one thing existence cannot catch: that each path names the right _kind_ of file for the condition enclosing it — `main` the format your package declares, `module` and every `import` condition an ESM file, every `require` condition a CommonJS one. A `.d.ts` has no module system of its own, so `types` paths are checked for existence only. Modern Node resolves through `exports` and ignores all three legacy fields, so a broken one stays invisible until it reaches a consumer who does not: an older bundler, or TypeScript on `moduleResolution: "node"`.

It is a **path check** — it confirms the files are there, not that they import cleanly. That is [`check-dist-loads`](scripts/check-dist-loads.cjs), which loads the built barrels on whichever Node runs it. `verify` runs both; CI repeats the load check at each end of the `engines` range.

## Choosing Which Formats to Build

All three formats are built by default. Set `BUILD_FORMATS` to a comma-separated subset of `cjs`, `es`, `types` to build fewer:

```sh
BUILD_FORMATS=es,types npm run build    # ESM-only package
BUILD_FORMATS=cjs,types npm run build   # CommonJS-only package
```

An unknown format name or an empty list fails the build with a clear message, rather than silently producing nothing.

### Making a Subset Permanent

A subset you keep needs two edits beyond the build command.

**Set `BUILD_FORMATS` wherever the build runs.** The [Verify workflow](.github/workflows/verify.yml) does not set it, so add it to the `npm run verify` step or CI keeps building all three.

**Prune `package.json` to match.** `check-declared-paths` tries every path the manifest declares against whatever is actually in `dist/`, so `verify` legitimately fails while the manifest still promises a format you stopped building. Drop that format's conditions from the `exports` map, and drop its entry field:

| Field    | Belongs to    | Keep it when you build |
| -------- | ------------- | ---------------------- |
| `main`   | `dist/cjs`    | `cjs`                  |
| `module` | `dist/es`     | `es`                   |
| `types`  | `dist/@types` | `types`                |

> **Delete the field — do not repoint it.** For an ESM-only package, `main: "dist/es/index.js"` looks like the obvious fix and is a trap: `main` is what resolvers that ignore `exports` follow, and they load it as CommonJS, so `require()` throws `ERR_REQUIRE_ESM`. An ESM-only package has no `main` — `module` and `exports` are its entry points. (Setting `"type": "module"` at the top level of `package.json` makes the whole package ESM; then `main` may point at ESM, and the check follows.)

## Testing

Jest runs through `ts-jest`, so a test file may be `.ts` or `.js` and import either kind of source. The demo suite sits in `tests/`, but that is a convention rather than a rule — the default patterns pick up `*.test.*` and `__tests__/` anywhere in the project, with the generated directories excluded. Coverage is collected from all of `src/` into `coverage_report/`, so a module no test touches shows up as a gap instead of vanishing from the report.

`verify` deliberately leaves tests out: it answers "does this build, and did every declared path land and load", not "does it work". Run `npm test` alongside it — CI runs both.

## Continuous Integration

The **Verify** workflow ([.github/workflows/verify.yml](.github/workflows/verify.yml)) is a single job that switches Node versions between steps:

- **Node 22** — installs dependencies, runs `npm run verify`, then `npm run test-coverage`.
- **Node 18** and **Node 24** — the ends of the `engines` range. Switching Node does not rebuild: each runs [`check-dist-loads`](scripts/check-dist-loads.cjs) against the same `dist/` built above — `dist/cjs/index.js` with `require()`, `dist/es/index.js` with `import()`, plus a presence check on `dist/@types/index.d.ts`.

Loading the barrel parses and executes every emitted module, and `verify` already ran the same check on Node 22, so the build is exercised across the whole `engines` range: a syntax level or runtime API your build emits but Node 18 does not accept fails here.

The script needs no configuration — it loads whatever is in `dist/`, so a pruned build is checked as it stands. Only a `dist/` nobody built fails it; a directory without its entry file, or a barrel that loads but exports nothing (the usual state right after deleting the demo code), is a warning.

The workflow is **manual-dispatch only** — start it from the "_Actions_" tab. Pushes and pull requests do not trigger it, so run `npm run verify` locally before committing.

**Running it automatically.** A published package usually wants this on every pull request. Add the triggers you need alongside the existing one — nothing else has to change:

```yaml
on:
  workflow_dispatch:
  pull_request:
  push:
    branches: [main]
```

Scope `push` narrowly — `[main]` above, not every branch — so you are not paying for a full install and build on every commit anywhere.

## Publishing

`package.json` ships only `dist/` (its `files` field), so the tarball carries the build and nothing else — no sources, no tests, no config. `prepack` runs `npm i && npm run build` automatically, so publishing always packs a fresh build instead of whatever `dist/` happened to hold. That includes `npm pack --dry-run`, which is not a quick look: it reinstalls, clears `dist/` and rebuilds before printing the list.

Before you publish:

```sh
npm run verify        # type-check, lint, build, check paths and loading
npm pack --dry-run    # list exactly what would be published
```

## Package Scripts

| Script                 | What it does                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `build`                | Clean `dist/` and build the configured formats into `dist/cjs`, `dist/es`, `dist/@types`                                        |
| `dev`                  | The same build, in watch mode                                                                                                   |
| `test`                 | Run the test suite once                                                                                                         |
| `test-watch`           | Run tests in watch mode                                                                                                         |
| `test-coverage`        | Run tests and write a coverage report to `coverage_report/`                                                                     |
| `test-coverage-watch`  | Coverage, in watch mode                                                                                                         |
| `check-types`          | Type-check without emitting files                                                                                               |
| `lint`                 | Run code quality checks over `src/` and `scripts/`                                                                              |
| `format`               | Format the repository with Prettier                                                                                             |
| `docs`                 | Generate API documentation into `code_documentation/`                                                                           |
| `check-updates`        | Report outdated dependencies                                                                                                    |
| `check-declared-paths` | Check that declared paths — `exports`, `main`, `module`, `types` — are in the build, runtime ones in the right format           |
| `check-dist-loads`     | Load the built `dist/cjs` and `dist/es` barrels on the current Node — proves they import cleanly, which the path check does not |
| `verify`               | Build and structural checks in one command: `check-types` → `lint` → `build` → `check-declared-paths` → `check-dist-loads`      |
| `prepack`              | Install and build before packing — runs automatically on `npm pack` and `npm publish`                                           |
| `clear`                | Remove generated directories: `build/` <sup>**(\*)**</sup>, `code_documentation/`, `coverage_report/`, `dist/`                  |
| `reset`                | `clear`, plus `node_modules/`                                                                                                   |
| `reset-hard`           | `reset`, plus every lockfile <sup>**(\*\*)**</sup>                                                                              |

<sup>**(\*)**</sup> _`build/` is the scratch output directory for a bare `tsc` run, separate from the final build artifacts in `dist/`._

<sup>**(\*\*)**</sup> _Safe while the lockfiles are untracked, as they are in this template. Once you commit yours (see [First Steps](#first-steps-after-using-the-template)), prefer plain `reset` in your checkout._

The `scripts/` directory holds the three commands the template implements itself — [`clear.cjs`](scripts/clear.cjs), [`check-declared-paths.cjs`](scripts/check-declared-paths.cjs) and [`check-dist-loads.cjs`](scripts/check-dist-loads.cjs). Plain Node, no dependency of their own.

## Configuration Files

| File                             | Purpose                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `package.json`                   | Project metadata, dependencies, scripts and the `exports` map. See [npm docs](https://docs.npmjs.com/cli/v10/configuring-npm/package-json) |
| `tsconfig.json`                  | TypeScript compiler settings for type checking and builds. See [TSConfig docs](https://www.typescriptlang.org/tsconfig)                    |
| `rollup.config.mjs`              | Build configuration — generates the CommonJS/ESM/Types outputs. See [Rollup docs](https://rollupjs.org/configuration-options)              |
| `jest.config.cjs`                | Test runner setup with TypeScript support. See [Jest docs](https://jestjs.io/docs/configuration)                                           |
| `.prettierrc`, `.prettierignore` | Formatting rules and the paths excluded from them. See [Prettier docs](https://prettier.io/docs/en/configuration)                          |
| `.gitignore`                     | Version control ignore patterns. See [gitignore docs](https://git-scm.com/docs/gitignore)                                                  |

## Issues and Support

If you encounter any issues or have questions, please open an issue on the [GitHub Issue Tracker](https://github.com/styiannis/ts-package-template/issues).

## License

This project is licensed under the [MIT License](https://github.com/styiannis/ts-package-template?tab=MIT-1-ov-file#readme).
