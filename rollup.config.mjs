// For detailed Rollup configuration options, visit: https://rollupjs.org/configuration-options/

import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import fs from 'node:fs';
import { dts } from 'rollup-plugin-dts';

/* ========================================================================== */
/* Setup                                                                      */
/* ========================================================================== */

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Minimal `.env` reader for `BUILD_FORMATS`. Existing env values are kept, so
// an inline `BUILD_FORMATS=... npm run build` overrides the file.
function loadEnvFile(path = '.env') {
  if (!fs.existsSync(path)) {
    return;
  }

  const lines = fs.readFileSync(path, 'utf8').split('\n');

  for (const line of lines) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);

    if (!match) {
      continue;
    }

    const key = match[1];
    const value = match[2] || '';

    if (process.env[key] === undefined) {
      process.env[key] = value.trim();
    }
  }
}

loadEnvFile();

/* ========================================================================== */
/* Build helpers                                                              */
/* ========================================================================== */

function emitPackageType(type) {
  return {
    name: 'emit-package-type',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'package.json',
        source: `${JSON.stringify({ type }, null, 2)}\n`,
      });
    },
  };
}

function external() {
  const externalModules = (externals) =>
    externals.length === 0
      ? () => false
      : (id) => new RegExp(`^(${externals.join('|')})($|/)`).test(id);

  return externalModules([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
  ]);
}

function output(preserveModulesRoot, dir, format) {
  return { dir, format, preserveModulesRoot, preserveModules: true };
}

/* ========================================================================== */
/* Format builders                                                            */
/* ========================================================================== */

function CJS(input, srcDir, distDir, useExternal) {
  const format = 'cjs';
  const outDir = `${distDir}/${format}`;

  return {
    input,
    output: output(srcDir, outDir, format),
    plugins: [
      ...(useExternal ? [] : [resolve()]),
      typescript({ compilerOptions: { outDir } }),
      emitPackageType('commonjs'),
    ],
    external: useExternal ? external() : undefined,
  };
}

function ES(input, srcDir, distDir, useExternal) {
  const format = 'es';
  const outDir = `${distDir}/${format}`;

  return {
    input,
    output: output(srcDir, outDir, format),
    plugins: [
      ...(useExternal ? [] : [resolve()]),
      typescript({ compilerOptions: { outDir } }),
      emitPackageType('module'),
    ],
    external: useExternal ? external() : undefined,
  };
}

function Types(input, srcDir, distDir, useExternal) {
  const format = 'es';
  const outDir = `${distDir}/@types`;

  return {
    input,
    output: output(srcDir, outDir, format),
    plugins: [
      ...(useExternal ? [] : [resolve()]),
      typescript({ compilerOptions: { outDir } }),
      dts(),
    ],
    external: useExternal ? external() : undefined,
  };
}

/* ========================================================================== */
/* Format resolution                                                          */
/* ========================================================================== */

const BUILDERS = { cjs: CJS, es: ES, types: Types };
const ALL_BUILD_FORMATS = Object.keys(BUILDERS);

const formats = (process.env.BUILD_FORMATS ?? ALL_BUILD_FORMATS.join(','))
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

if (formats.length === 0) {
  throw new Error(
    `BUILD_FORMATS: at least one of "${ALL_BUILD_FORMATS.join(', ')}" is required.`
  );
}

const unknownFormats = process.env.BUILD_FORMATS
  ? formats.filter((f) => !ALL_BUILD_FORMATS.includes(f))
  : [];

if (unknownFormats.length > 0) {
  throw new Error(
    `BUILD_FORMATS: unknown format(s) "${unknownFormats.join(', ')}". Valid: ${ALL_BUILD_FORMATS.join(', ')}.`
  );
}

/* ========================================================================== */
/* Entry & export                                                             */
/* ========================================================================== */

const srcDir = 'src';
const distDir = 'dist';
const inputFile = `${srcDir}/index.ts`;

export default formats.map((f) =>
  BUILDERS[f](inputFile, srcDir, distDir, true)
);
