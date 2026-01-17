
import { ResortDataSchema } from '../backend/validation/schemas.js';

const resortMock = {
    id: "kronplatz",
    name: "Kronplatz Test"
};

const rawDataMock = {
    id: "kronplatz",
    status: "live",
    liftsOpen: 0,
    liftsTotal: 10
    // name intentionally missing to test fallback
};

console.log("--- Testing Validation Logic ---");

let finalName = rawDataMock.name;
if (!finalName && resortMock.name) finalName = resortMock.name;
if (!finalName) {
    console.log("⚠️ Fallback to Unknown");
    finalName = "Unknown Resort";
}

console.log(`Final Name: "${finalName}"`);

const dataToValidate = {
    id: resortMock.id,
    status: rawDataMock.status || 'live',
    ...rawDataMock,
    name: finalName,
    lastUpdated: new Date().toISOString()
};

console.log("Object to validate:", JSON.stringify(dataToValidate, null, 2));

const validation = ResortDataSchema.safeParse(dataToValidate);

if (!validation.success) {
    console.error("❌ Validation Failed:", JSON.stringify(validation.error.format(), null, 2));
} else {
    console.log("✅ Validation Success");
}
