import { describe, test, expect } from '@jest/globals';
import { getStaticResorts, getResortConfig } from '../services/resorts/service.js';
import { ResortDataSchema } from '../utils/schema.js';

describe('Resort Manager', () => {
    test('should load static resorts', () => {
        const resorts = getStaticResorts();
        expect(resorts).toBeDefined();
        expect(Array.isArray(resorts)).toBe(true);
        expect(resorts.length).toBeGreaterThan(0);
    });

    test('should get resort by ID', () => {
        const resort = getResortConfig('spitzingsee');
        expect(resort).toBeDefined();
        expect(resort.id).toBe('spitzingsee');
        expect(resort.name).toBeDefined();
    });

    test('should return null for invalid resort ID', () => {
        const resort = getResortConfig('invalid-id');
        expect(resort).toBeUndefined();
    });
});

describe('Data Schema Validation', () => {
    test('should validate correct resort data', () => {
        const validData = {
            status: 'live',
            liftsOpen: 10,
            liftsTotal: 20,
            snow: '50 cm',
            weather: 'Sunny'
        };

        const result = ResortDataSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    test('should reject invalid status', () => {
        const invalidData = {
            status: 'invalid_status',
            liftsOpen: 10,
            liftsTotal: 20
        };

        const result = ResortDataSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});

describe('Cache System', () => {
    test('should import cache modules', async () => {
        const { parserCache, weatherCache, trafficCache } = await import('../services/cache.js');
        expect(parserCache).toBeDefined();
        expect(weatherCache).toBeDefined();
        expect(trafficCache).toBeDefined();
    });
});
