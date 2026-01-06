
export async function fetchIntermaps(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch Intermaps data: ${response.status}`);
        }
        const data = await response.json();

        // Logic to count open lifts
        // Structure: { lifts: [ { status: 'open'|'closed', ... } ] }

        let liftsOpen = 0;
        let liftsTotal = 0;

        if (data.lifts && Array.isArray(data.lifts)) {
            liftsTotal = data.lifts.length;
            liftsOpen = data.lifts.filter(lift => lift.status === 'open').length;
        }

        return {
            liftsOpen,
            liftsTotal,
            status: "live",
            source: url,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error(`Intermaps parser error for ${url}:`, error.message);
        return null;
    }
}
