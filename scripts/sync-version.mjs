#!/usr/bin/env node
/**
 * Version Sync Script
 * 
 * Ensures all version strings in the project match package.json
 * Run: node scripts/sync-version.js [--check]
 *   --check: Only check, don't fix (for CI)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const checkOnly = process.argv.includes('--check');

// Read canonical version from package.json
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const VERSION = pkg.version;

console.log(`📦 Canonical version: ${VERSION}`);

// Files to sync (relative to root)
const FILES_TO_SYNC = [
    {
        path: 'backend/package.json',
        type: 'json',
        key: 'version'
    },
    {
        path: 'README.md',
        type: 'regex',
        pattern: /# 🏔️ Skigebiet-Finder v[\d.]+/,
        replacement: `# 🏔️ Skigebiet-Finder v${VERSION}`
    },
    {
        path: 'index.html',
        type: 'regex',
        pattern: /<span class="text-gray text-md">v[\d.]+[^<]*<\/span>/,
        replacement: `<span class="text-gray text-md">v${VERSION}</span>`
    },
    {
        path: 'backend/index.js',
        type: 'regex',
        pattern: /version: "[\d.]+"/g,
        replacement: `version: "${VERSION}"`
    },
    {
        path: 'backend/index.js',
        type: 'regex',
        pattern: /\(v[\d.]+\)/,
        replacement: `(v${VERSION})`
    }
];

let hasErrors = false;

for (const file of FILES_TO_SYNC) {
    const filePath = path.join(ROOT, file.path);

    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${file.path}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content;

    if (file.type === 'json') {
        const json = JSON.parse(content);
        if (json[file.key] !== VERSION) {
            if (checkOnly) {
                console.error(`❌ ${file.path}: ${file.key} is "${json[file.key]}", expected "${VERSION}"`);
                hasErrors = true;
            } else {
                json[file.key] = VERSION;
                newContent = JSON.stringify(json, null, 2) + '\n';
                console.log(`✅ ${file.path}: Updated ${file.key} to "${VERSION}"`);
            }
        } else {
            console.log(`✓  ${file.path}: OK`);
        }
    } else if (file.type === 'regex') {
        const match = content.match(file.pattern);
        if (match && match[0] !== file.replacement) {
            if (checkOnly) {
                console.error(`❌ ${file.path}: Found "${match[0]}", expected "${file.replacement}"`);
                hasErrors = true;
            } else {
                newContent = content.replace(file.pattern, file.replacement);
                console.log(`✅ ${file.path}: Updated version to "${VERSION}"`);
            }
        } else if (match) {
            console.log(`✓  ${file.path}: OK`);
        } else {
            console.warn(`⚠️  ${file.path}: Pattern not found`);
        }
    }

    if (!checkOnly && newContent !== content) {
        fs.writeFileSync(filePath, newContent);
    }
}

if (checkOnly && hasErrors) {
    console.error('\n❌ Version mismatch detected! Run "node scripts/sync-version.js" to fix.');
    process.exit(1);
} else if (!checkOnly) {
    console.log('\n✅ All versions synchronized to', VERSION);
}
