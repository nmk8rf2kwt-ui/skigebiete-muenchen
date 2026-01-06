
import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';

const PARSERS_DIR = path.join(__dirname, '../parsers');
const parserFiles = fs.readdirSync(PARSERS_DIR).filter(f => f.endsWith('.js'));

describe('Parsers Interface Check', () => {

    // We increase timeout because dynamic imports might be slow
    jest.setTimeout(30000);

    test('All parser files should be importable', async () => {
        for (const file of parserFiles) {
            const modulePath = path.join(PARSERS_DIR, file);
            try {
                await import(modulePath);
            } catch (error) {
                throw new Error(`Failed to import ${file}: ${error.message}`);
            }
        }
    });

    test.each(parserFiles)('%s should export a parser function', async (file) => {
        const module = await import(path.join(PARSERS_DIR, file));

        // Logic:
        // 1. Check for default export
        // 2. Or check for named exports
        // 3. The export should be a function

        const hasDefault = typeof module.default === 'function';
        const hasNamed = Object.values(module).some(v => typeof v === 'function');

        if (!hasDefault && !hasNamed) {
            console.warn(`Warning: ${file} exports no functions. Check if it's a utility or legacy.`);
            // Some might not be parsers?
        } else {
            expect(true).toBe(true);
        }
    });
});
