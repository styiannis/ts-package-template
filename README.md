# TypeScript Package Template

![Static Badge](https://img.shields.io/badge/Node.js-ffffff?logo=nodedotjs&logoColor=417e38)
![Static Badge](https://img.shields.io/badge/JavaScript-ffffff?logo=javascript&logoColor=fcdc00)
![Static Badge](https://img.shields.io/badge/TypeScript-ffffff?logo=typescript&logoColor=3178c6)
![Static Badge](https://img.shields.io/badge/Rollup.js-ffffff?logo=rollup.js&logoColor=ff3333)
![Static Badge](https://img.shields.io/badge/Jest-ffffff?logo=jest&logoColor=c21325)
![Static Badge](https://img.shields.io/badge/Prettier-ffffff?logo=prettier&logoColor=f7ba3e)

A TypeScript package template delivering dual-format builds (CommonJS/ESM), comprehensive type declarations, and maintained source hierarchy for modular package development.

## Features

### Development

- 🏗️ **Modular Exports** - Preserves source structure in build output for optimal organization
- 📦 **Dual Module System** - Seamless support for both CommonJS and ESM formats
- 🔷 **Type Safety** - Strict TypeScript checking for enhanced reliability

### Testing & Quality

- 🧪 **Testing** - Jest-powered test suite with coverage reporting
- 🔍 **Code Quality** - Automated linting and formatting pipeline
- 🔄 **CI/CD** - GitHub Actions for seamless integration workflow

### Tools & Documentation

- 🛠️ **Build Tools** - Optimized bundling with Rollup.js
- 📝 **Documentation** - Automated TypeDoc API generation

## Table of Contents

- [System Requirements](#system-requirements)
- [Getting Started](#getting-started)
  - [Use Template](#use-template)
  - [Customize Template](#customize-template)
- [Configuration Files](#configuration-files)
  - [Build Configuration](#build-configuration)
  - [Testing Configuration](#testing-configuration)
  - [Code Quality Configuration](#code-quality-configuration)
- [Package Scripts](#package-scripts)
  - [Build Scripts](#build-scripts)
    - [build](#build)
    - [dev](#dev)
  - [Test Scripts](#test-scripts)
    - [test](#test)
    - [test-watch](#test-watch)
    - [test-coverage](#test-coverage)
    - [test-coverage-watch](#test-coverage-watch)
  - [Code Quality Scripts](#code-quality-scripts)
    - [check-types](#check-types)
    - [format](#format)
    - [lint](#lint)
  - [Documentation Scripts](#documentation-scripts)
    - [docs](#docs)
  - [Utility Scripts](#utility-scripts)
    - [check-updates](#check-updates)
    - [ci](#ci)
    - [clear](#clear)
    - [prepack](#prepack)
    - [reset](#reset)
    - [validate-exports](#validate-exports)
- [Continuous Integration](#continuous-integration)
  - [Build and Test Workflow](#build-and-test-workflow)
- [Issues and Support](#issues-and-support)
- [License](#license)

## System Requirements

| Package     | Version    |
| ----------- | ---------- |
| **Node.js** | ≥ `18.0.0` |
| **npm**     | ≥ `8.0.0`  |

## Getting Started

### Use Template

You can start using this template in two ways:

**A.** Using GitHub's "_Use this template_" button:

1. Click the "_Use this template_" button at the top of the repository
2. Follow GitHub's instructions to create your repository
3. Clone your new repository locally

**B.** Direct clone:

```sh
git clone https://github.com/styiannis/tmplt-ts-package my-package
cd my-package
npm install
```

### Customize Template

- **Update `package.json`**:
  - Update `name`, `version`, `description`, `keywords`, `author`, and `license` fields to reflect your project details.
  - Update the `repository` and `bugs` fields to point to your project's repository and issue tracker.
  - Ensure the `exports` section aligns with your package structure.

- **Update Source Files**:
  - Modify the files in `./src` directory and customize `index.ts` to export your project's main functionalities.

- **Update Test Files**:
  - Modify the tests in `./tests` directory to verify the functionality of your project's source files.

- **Update Documentation**:
  - Revise the `README.md` document to accurately reflect your project.

## Configuration Files

### Build Configuration

- `package.json` - Project configuration, dependencies and scripts. See [npm docs](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
- `tsconfig.json` - TypeScript compiler settings for type checking and builds. See [TSConfig docs](https://www.typescriptlang.org/tsconfig)
- `rollup.config.mjs` - Bundler setup for generating CommonJS/ESM/Types outputs. See [Rollup docs](https://rollupjs.org/configuration-options)

### Testing Configuration

- `jest.config.js` - Jest testing framework setup with TypeScript support. See [Jest docs](https://jestjs.io/docs/configuration)

### Code Quality Configuration

- `.prettierrc` - Code formatting rules for consistent style. See [Prettier docs](https://prettier.io/docs/en/configuration)
- `.prettierignore` - Files and folders to exclude from formatting
- `.gitignore` - Version control ignore patterns for Git. See [gitignore docs](https://git-scm.com/docs/gitignore)

## Package Scripts

### Build Scripts

#### build

Build the package into CommonJS, ESM formats with TypeScript declarations in `./dist` folder:

- `./dist/cjs/*` - CommonJS modules
- `./dist/es/*` - ESM modules
- `./dist/@types/*` - TypeScript declarations

```sh
npm run build
```

#### dev

Development (watch) mode: Rebuild package automatically when source files change.

```sh
npm run dev
```

### Test Scripts

#### test

Run all unit tests once.

```sh
npm run test
```

#### test-watch

Run tests in watch mode for development.

```sh
npm run test-watch
```

#### test-coverage

Run tests with coverage reporting in `./coverage_report` folder.

```sh
npm run test-coverage
```

#### test-coverage-watch

Run tests with coverage in watch mode.

```sh
npm run test-coverage-watch
```

### Code Quality Scripts

#### check-types

Verify TypeScript types without emitting files.

```sh
npm run check-types
```

#### format

Format all files using Prettier configuration.

```sh
npm run format
```

#### lint

Run code quality checks.

```sh
npm run lint
```

### Documentation Scripts

#### docs

Generate code documentation from source files in `./code_documentation` folder.

```sh
npm run docs
```

### Utility Scripts

#### check-updates

Scan for outdated package dependencies.

```sh
npm run check-updates
```

#### ci

Run continuous integration checks: types, lint, build and exports validation.

```sh
npm run ci
```

#### clear

Clean up generated directories (`./build` <sup>**(\*)**</sup>, `./code_documentation`, `./coverage_report`, `./dist`).

```sh
npm run clear
```

<sup>**(\*)**</sup> _The `./build` directory serves as temporary output for TypeScript compilation (`tsc`), separate from the final build artifacts in `./dist`._

#### prepack

Install dependencies and build package before publishing. It runs automatically during `npm pack` and `npm publish`. See [npm docs: prepack](https://docs.npmjs.com/cli/v10/using-npm/scripts#life-cycle-scripts).

```sh
npm run prepack
```

#### reset

Remove dependencies and all generated files (`./build`, `./code_documentation`, `./coverage_report`, `./dist`, `./node_modules`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`).

```sh
npm run reset
```

#### validate-exports

Verify `package.json` exports paths exist in build output.

```sh
npm run validate-exports
```

## Continuous Integration

This project uses GitHub Actions for continuous integration workflows.

### Build and Test Workflow

The **Build and Test** workflow ensures code quality and test coverage by performing the following steps:

- **Checkout Code**: Checks out the repository code.
- **Set Up Node.js Environment**: Configures the Node.js environment.
- **Install Dependencies**: Installs project dependencies using `npm install`.
- **Run CI Script**: Executes `npm run ci` to perform type checks, linting, build, and exports validation.
- **Run Tests with Coverage**: Runs `npm run test-coverage` to execute tests with coverage reporting.
- **Reset Environment**: Cleans up the environment using `npm run reset`.

**Trigger**: This workflow is set up for manual triggering via [workflow dispatch](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch). You can manually start the workflow from the "_Actions_" tab in your GitHub repository.

For more information on configuring and using GitHub Actions, refer to the [GitHub Actions Documentation](https://docs.github.com/en/actions).

## Issues and Support

If you encounter any issues or have questions, please open an issue on the [GitHub Issue Tracker](https://github.com/styiannis/tmplt-ts-package/issues).

## License

This project is licensed under the [MIT License](https://github.com/styiannis/tmplt-ts-package?tab=MIT-1-ov-file#readme).
