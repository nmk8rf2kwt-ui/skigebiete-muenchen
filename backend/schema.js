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

    // Allow other fields but strict on the core ones
}).passthrough();

export const TrafficDataSchema = z.object({
    duration: z.number().min(0),     // minutes
    distance: z.string().or(z.number()) // sometimes km string, sometimes number? let's standardise later
}).optional();
