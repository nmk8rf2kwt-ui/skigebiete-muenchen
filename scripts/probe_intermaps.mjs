
// using native fetch
const candidates = [
    { id: 'saalbach', url: 'https://winter.intermaps.com/saalbach_hinterglemm_leogang_fieberbrunn/data?lang=de' },
    { id: 'schladming', url: 'https://winter.intermaps.com/schladming_dachstein/data?lang=de' },
    { id: 'snow_space_salzburg', url: 'https://winter.intermaps.com/snow_space_salzburg/data?lang=de' },
    { id: 'obertauern', url: 'https://winter.intermaps.com/obertauern/data?lang=de' },
    { id: 'soelden', url: 'https://winter.intermaps.com/soelden/data?lang=de' },
    { id: 'ischgl', url: 'https://winter.intermaps.com/ischgl_samnaun/data?lang=de' },
    { id: 'st_anton', url: 'https://winter.intermaps.com/arlberg/data?lang=de' },
    { id: 'serfaus_fiss_ladis', url: 'https://winter.intermaps.com/serfaus_fiss_ladis/data?lang=de' },
    { id: 'zillertal_arena', url: 'https://winter.intermaps.com/zillertal_arena/data?lang=de' }
];

async function probe() {
    for (const c of candidates) {
        try {
            const res = await fetch(c.url);
            if (res.ok) {
                const data = await res.json();
                console.log(`✅ ${c.id}: Found data. Lifts: ${data.lifts?.length || 0}`);
            } else {
                console.log(`❌ ${c.id}: Failed (${res.status})`);
            }
        } catch (e) {
            console.log(`❌ ${c.id}: Error (${e.message})`);
        }
    }
}

probe();
