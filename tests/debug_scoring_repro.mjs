
// Mocks required for browser modules
global.window = {
    location: { hostname: 'localhost', origin: 'http://localhost' }
};
global.document = {
    addEventListener: () => { }
};
global.localStorage = {
    getItem: () => null,
    setItem: () => { }
};

console.log("Loading module...");
// Dynamic Import to ensure mocks exist before module evaluation
const { calculateScore } = await import('../js/render.js');

// --- Test Data Scenarios ---

// 1. Good Data (Stubai Style)
const RESORT_GOOD = {
    name: "Good Value Resort",
    status: "live",
    lifts: { open: 20, total: 26 },
    price: 65,
    snow: { mountain: 150, valley: 50 },
    distance: 120, // Traffic mins/or numeric
    traffic: { duration: 7200, delay: 0 }, // 120 mins
    weather: "Sonnig"
};

// 2. Bad String Data (Scraper style - as suspected)
const RESORT_BAD_STRINGS = {
    name: "String Resort",
    status: "live",
    lifts: { open: "10", total: "20" },
    price: "50 €",
    snow: { mountain: "80 cm", valley: "20 cm" },
    distance: "90 min", // String!
    traffic: { duration_min: "90 min", delay: "10 min" }, // Strings
    weather: "Bewölkt"
};

// 3. Minimum Data (Static Only + Distance String)
const RESORT_MINIMAL = {
    name: "Minimal Resort",
    status: "static",
    distance: "60 km", // String km
    // No snow, no traffic, no price
};

// 4. Broken/Ghost Data
const RESORT_BROKEN = {
    name: "Broken Resort",
    status: "error",
    // Missing everything
};

const resorts = [RESORT_GOOD, RESORT_BAD_STRINGS, RESORT_MINIMAL, RESORT_BROKEN];

console.log("--- Scoring Debug Run ---");

resorts.forEach(r => {
    try {
        // Clone to allow mutation
        const rClone = JSON.parse(JSON.stringify(r));
        const score = calculateScore(rClone, 'all', 'ski');

        // breakdown is attached to object by calculateScore (in place mutation)
        const breakdown = rClone.scoreBreakdown || [];

        console.log(`\nResort: ${r.name}`);
        console.log(`Score: ${score}`);
        if (score === 0) console.log("!!! ALERT: ZERO SCORE !!!");
        console.log("Breakdown:", breakdown.map(b => `${b.text} (${b.pts})`).join(", "));
    } catch (e) {
        console.error(`Error calculating ${r.name}:`, e);
    }
});
