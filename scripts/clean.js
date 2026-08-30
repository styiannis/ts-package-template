const { rmSync } = require('node:fs');
const path = require('node:path');

const root = process.cwd();

const targets = process.argv.slice(2).map((target) => {
  const resolved = path.resolve(root, target);

  if (resolved === root || !resolved.startsWith(root + path.sep)) {
    throw new Error(`Refusing to delete outside project root: ${target}`);
  }

  return resolved;
});

for (const resolved of targets) {
  rmSync(resolved, { recursive: true, force: true, maxRetries: 3 });
}
