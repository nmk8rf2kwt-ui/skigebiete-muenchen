import { fetchWithHeaders } from '../utils/fetcher.js';

const urls = [
    { id: 'ofterschwang', url: 'https://winter.intermaps.com/ofterschwang/data?lang=de' },
    { id: 'bolsterlang', url: 'https://winter.intermaps.com/hoernerbahn/data?lang=de' },
    { id: 'berwang', url: 'https://winter.intermaps.com/berwang/data?lang=de' }
];

async function analyze() {
    for (const { id, url } of urls) {
        console.log(`\n=== ${id.toUpperCase()} ===`);
        try {
            const res = await fetchWithHeaders(url);
            const data = await res.json();

            console.log('Top-level keys:', Object.keys(data));

            // Check for facilities/lifts/slopes arrays
            if (data.facilities) {
                console.log(`Facilities count: ${data.facilities.length}`);
                if (data.facilities.length > 0) {
                    console.log('Sample facility:', JSON.stringify(data.facilities[0], null, 2));
                }
            }

            if (data.lifts) {
                console.log(`Lifts count: ${data.lifts.length}`);
                if (data.lifts.length > 0) {
                    console.log('Sample lift keys:', Object.keys(data.lifts[0]));
                }
            }

            if (data.slopes || data.pistes) {
                const slopes = data.slopes || data.pistes;
                console.log(`Slopes count: ${slopes.length}`);
                if (slopes.length > 0) {
                    console.log('Sample slope keys:', Object.keys(slopes[0]));
                }
            }
        } catch (e) {
            console.log('Error:', e.message);
        }
    }
}

analyze();
