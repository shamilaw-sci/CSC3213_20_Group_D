/**
 * @file check-syntax.js
 * @module Scripts
 * @desc Runs Node syntax validation for every backend JavaScript source file.
 * @author Wasana Karunanayaka (S/21/081)
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const backendRoot = path.resolve(__dirname, '..');
const excludedDirectories = new Set(['node_modules']);

const collectJavaScriptFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return excludedDirectories.has(entry.name)
        ? []
        : collectJavaScriptFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith('.js')
      ? [entryPath]
      : [];
  });

const files = collectJavaScriptFiles(backendRoot);

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log(`Syntax check passed for ${files.length} backend JavaScript files.`);
