import { z } from 'zod';

// --- Sub-Schemas ---

const LiftSchema = z.object({
    status: z.enum(['open', 'closed', 'unknown', 'scheduled']).or(z.string()).optional(),
    open: z.number().min(0).optional(),
    total: z.number().min(0).optional(),
    details: z.any().optional() // Allow flexible details for now
});

const SlopeSchema = z.object({
    status: z.enum(['open', 'closed', 'unknown', 'scheduled']).or(z.string()).optional(),
    open: z.number().min(0).optional(),
    total: z.number().min(0).optional(),
    details: z.any().optional()
});

const WeatherSchema = z.object({
    current: z.object({
        temperature: z.number().optional().nullable(),
        weatherText: z.string().optional().nullable(),
        icon: z.string().optional().nullable()
    }).optional(),
    forecast: z.array(z.any()).optional()
});

const SnowSchema = z.object({
    mountain: z.number().nullable().optional(),
    valley: z.number().nullable().optional(),
    lastSnowfall: z.string().nullable().optional(), // ISO Date string
    info: z.string().optional()
});

// --- Main Resort Schema ---
// We use .passthrough() to allow extra properties (like internal IDs or temporary flags) without stripping them,
// but validate the core structure we depend on.

// --- Main Resort Schema ---
export const ResortDataSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    status: z.enum(['live', 'static_only', 'error', 'maintenance', 'closed', 'ok']).or(z.string()),

    // Core Data - Mixed Types (Legacy String vs New Object)
    lifts: z.union([LiftSchema, z.array(z.any()), z.number()]).optional(), // Legacy sometimes had number
    slopes: z.union([SlopeSchema, z.array(z.any()), z.number()]).optional(),

    // Flattened for compatibility
    liftsOpen: z.number().nullable().optional(),
    liftsTotal: z.number().nullable().optional(),

    // Weather/Snow can be simple strings (scrapers) or complex objects (weather service)
    weather: z.union([z.string(), WeatherSchema]).nullable().optional(),
    snow: z.union([z.string(), SnowSchema]).nullable().optional(),

    // Metadata
    lastUpdated: z.date().or(z.string()).optional(),
    source: z.string().optional()
}).passthrough();

export const ResortSchema = ResortDataSchema; // Alias for backward compat if needed

// Export a robust parse function that handles errors gracefully (optional helper)
export const safeParseResort = (data) => {
    const result = ResortSchema.safeParse(data);
    if (!result.success) {
        console.warn(`[Validation Warning] Resort ${data.id || 'unknown'} failed validation:`, result.error.format());
        return null;
    }
    return result.data;
};
