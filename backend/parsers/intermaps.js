
export async function fetchIntermaps(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch Intermaps data: ${response.status}`);
        }
        const data = await response.json();

        // Extract detailed lifts
        const lifts = [];
        if (data.lifts && Array.isArray(data.lifts)) {
            data.lifts.forEach(lift => {
                // Extract name from subtitle or searchdesc
                const name = lift.subtitle || lift.searchdesc || lift.id || 'Unknown';

                // Map status
                let status = 'unknown';
                if (lift.status === 'open' || lift.status === 1) status = 'open';
                else if (lift.status === 'closed' || lift.status === 0) status = 'closed';

                lifts.push({
                    name: name.trim(),
                    status,
                    type: lift.type || undefined
                });
            });
        }

        // Extract detailed slopes
        const slopes = [];
        if (data.slopes && Array.isArray(data.slopes)) {
            data.slopes.forEach(slope => {
                // Extract name from subtitle or searchdesc
                const name = slope.subtitle || slope.searchdesc || slope.id || 'Unknown';

                // Map status
                let status = 'unknown';
                if (slope.status === 'open' || slope.status === 1) status = 'open';
                else if (slope.status === 'closed' || slope.status === 0) status = 'closed';

                // Try to determine difficulty from type or icon
                let difficulty = undefined;
                if (slope.type && typeof slope.type === 'string') {
                    const t = slope.type.toLowerCase();
                    if (t.includes('blue') || t.includes('easy') || t.includes('leicht')) difficulty = 'blue';
                    else if (t.includes('red') || t.includes('medium') || t.includes('mittel')) difficulty = 'red';
                    else if (t.includes('black') || t.includes('difficult') || t.includes('schwer')) difficulty = 'black';
                }

                slopes.push({
                    name: name.trim(),
                    status,
                    type: slope.type || undefined,
                    difficulty
                });
            });
        }

        const liftsOpen = lifts.filter(l => l.status === 'open').length;
        const liftsTotal = lifts.length;

        return {
            liftsOpen,
            liftsTotal,
            lifts,
            slopes,
            status: "live",
            source: url,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error(`Intermaps parser error for ${url}:`, error.message);
        return null;
    }
}
