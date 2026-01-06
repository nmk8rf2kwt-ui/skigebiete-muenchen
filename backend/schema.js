import { z } from "zod";

export const ResortDataSchema = z.object({
    // Required fields from parsers
    status: z.enum(["live", "static_only", "error", "closed", "ok"]),
    liftsOpen: z.number().int().optional().nullable(),
    liftsTotal: z.number().int().optional().nullable(),
    snow: z.string().optional().nullable(),
    weather: z.string().optional().nullable(),
    source: z.string().optional(),
    lastUpdated: z.string().datetime({ offset: true }).optional(), // ISO string

    // Detailed Lift & Slope Data
    lifts: z.array(z.object({
        name: z.string(),
        status: z.enum(["open", "closed", "unknown", "scheduled"]),
        type: z.string().optional(),
        capacity: z.number().optional(),
        length: z.number().optional(), // meters
        altitudeStart: z.number().optional(),
        altitudeEnd: z.number().optional(),
        operatingHours: z.string().optional(), // "08:30 - 16:00"
        seasonStart: z.string().optional(), // "2025-11-22"
        seasonEnd: z.string().optional() // "2026-04-06"
    })).optional(),

    slopes: z.array(z.object({
        name: z.string(),
        status: z.enum(["open", "closed", "unknown"]),
        difficulty: z.enum(["blue", "red", "black", "freeride", "unknown"]).optional(),
        length: z.number().optional(), // meters
        altitudeStart: z.number().optional(),
        altitudeEnd: z.number().optional(),
        operatingHours: z.string().optional(), // "08:30 - 16:00"
        seasonStart: z.string().optional(), // "2025-11-22"
        seasonEnd: z.string().optional() // "2026-04-06"
    })).optional(),

    // Allow other fields but strict on the core ones
}).passthrough();

export const TrafficDataSchema = z.object({
    duration: z.number().min(0),     // minutes
    distance: z.string().or(z.number()) // sometimes km string, sometimes number? let's standardise later
}).optional();
