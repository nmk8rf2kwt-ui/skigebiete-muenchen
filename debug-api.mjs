
// Debug script to check /api/resorts response
async function run() {
    try {
        console.log("Fetching http://127.0.0.1:10000/api/resorts...");
        const res = await fetch('http://127.0.0.1:10000/api/resorts');
        if (!res.ok) {
            console.error("HTTP Error:", res.status);
            return;
        }
        const data = await res.json();

        console.log("Total resorts:", data.length);

        // Find Brauneck
        const brauneck = data.find(r => r.name.includes("Brauneck"));
        if (brauneck) {
            console.log("Brauneck Data:", JSON.stringify(brauneck, null, 2));
            console.log("Brauneck Lifts:", brauneck.liftsOpen, "/", brauneck.liftsTotal);
            console.log("Brauneck Weather:", brauneck.weather);
            console.log("Brauneck Snow:", brauneck.snow);
        } else {
            console.log("Brauneck not found!");
        }

        // Check Top 3 example (Nordkette)
        const nordkette = data.find(r => r.name.includes("Nordkette"));
        if (nordkette) {
            console.log("Nordkette Data:", JSON.stringify(nordkette, null, 2));
        }

    } catch (e) {
        console.log("Error:", e);
    }
}

run();
