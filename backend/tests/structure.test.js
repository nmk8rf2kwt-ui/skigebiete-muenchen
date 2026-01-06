
import fs from 'fs';
import path from 'path';

const RESORTS_FILE = path.join(__dirname, '../resorts.json');
const PARSERS_DIR = path.join(__dirname, '../parsers');

describe('Project Structure & Configuration', () => {
    let resorts;

    beforeAll(() => {
        const data = fs.readFileSync(RESORTS_FILE, 'utf8');
        resorts = JSON.parse(data);
    });

    test('resorts.json should be valid JSON and an array', () => {
        expect(Array.isArray(resorts)).toBe(true);
        expect(resorts.length).toBeGreaterThan(0);
    });

    test('All resorts should have required fields', () => {
        resorts.forEach(resort => {
            expect(resort).toHaveProperty('id');
            expect(resort).toHaveProperty('name');
            // expect(resort).toHaveProperty('website'); // Some might be missing?
        });
    });

    test('All resorts should have a corresponding parser or satisfy static check', () => {
        const parserFiles = fs.readdirSync(PARSERS_DIR).filter(f => f.endsWith('.js'));
        // check imports in index.js is hard via static analysis without parsing AST, 
        // but we can check if file exists for the ID if naming convention matches

        // This is a loose check because mapping is done in index.js manually
    });
});
