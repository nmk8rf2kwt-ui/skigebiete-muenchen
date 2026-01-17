export const DOMAIN_CONFIGS = {
    ski: {
        id: 'ski',
        label: 'Skifahren',
        icon: '🎿',
        subline: 'Heute sinnvoll?',
        endpoint: '/api/resorts',
        metrics: [
            { id: 'lifts', label: 'Offen', icon: '🚠', formatter: (r) => (r.liftsOpen !== null && r.liftsOpen !== undefined) ? `${Math.round((r.liftsOpen / (r.liftsTotal || r.lifts || 1)) * 100)}%` : '-' },
            {
                id: 'snow',
                label: 'Schnee',
                icon: '❄️',
                formatter: (r) => {
                    if (r.snow && typeof r.snow === 'object') {
                        return `${r.snow.mountain ?? r.snow.valley ?? 0} cm`;
                    }
                    return r.snow || '0 cm';
                }
            },
            {
                id: 'weather',
                label: 'Wetter',
                icon: (r) => {
                    const w = r.weather;
                    if (!w) return '🌤️';

                    // 1. If string contains Emoji, return it (simple heuristic)
                    const emojiMatch = typeof w === 'string' && w.match(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/);
                    if (emojiMatch) return emojiMatch[0];

                    // 2. Keyword mapping (Fallback for plain text)
                    const text = (typeof w === 'string' ? w : (w.description || '')).toLowerCase();
                    if (text.includes('sonne') || text.includes('klar') || text.includes('sun') || text.includes('clear')) return '☀️';
                    if (text.includes('schnee') || text.includes('snow')) return '❄️';
                    if (text.includes('regen') || text.includes('rain')) return '🌧️';
                    if (text.includes('nebel') || text.includes('fog')) return '🌫️';
                    if (text.includes('gewitter') || text.includes('storm')) return '⛈️';
                    if (text.includes('wolke') || text.includes('cloud') || text.includes('overcast') || text.includes('trüb')) return '☁️';

                    return '🌤️';
                },
                formatter: (r) => {
                    const w = r.weather;
                    if (!w) return '-';
                    if (typeof w === 'string') {
                        // Optional: Strip emoji from text if we display it above?
                        // User screenshot showed only text. But our data has emoji.
                        // Let's keep it as is for now to minimize risk.
                        return w.replace(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/, '').trim() || w;
                    }
                    return `${w.temp || ''}`.trim();
                }
            },
            { id: 'eta', label: 'Anfahrt', icon: '🚗', formatter: (r) => `${Math.round((r.traffic?.duration || 0) / 60 || r.distance || 0)} min` }
        ],
        prefs: [
            { id: 'travel', label: 'Schnell & wenig Stau', icon: '🚀' },
            { id: 'conditions', label: 'Gute Bedingungen', icon: '✨' },
            { id: 'weather', label: 'Gutes Wetter', icon: '☀️' },
            { id: 'large', label: 'Großes Skigebiet', icon: '🏔️' },
            { id: 'easy', label: 'Einfaches Skigebiet', icon: '😌' },
            { id: 'price', label: 'Günstig', icon: '💰' }
        ]
    },
    skitour: {
        id: 'skitour',
        label: 'Skitour',
        icon: '🏔️',
        subline: 'Pulver oder Harsch?',
        endpoint: '/api/skitours',
        metrics: [
            { id: 'snow', label: 'Neuschnee', icon: '❄️', formatter: (r) => `${r.newSnow ?? 0} cm` },
            { id: 'danger', label: 'Lawine', icon: '⚠️', formatter: (r) => `Stufe ${r.avalancheLevel ?? '?'}` },
            { id: 'eta', label: 'Anfahrt', icon: '🚗', formatter: (r) => `${r.distance ?? '?'} min` }
        ],
        prefs: [
            { id: 'safe', label: 'Sicher', icon: '🛡️' },
            { id: 'powder', label: 'Pulverschnee', icon: '❄️' },
            { id: 'close', label: 'Nah an MUC', icon: '📍' }
        ]
    },
    skate: {
        id: 'skate',
        label: 'Eislaufen',
        icon: '⛸️',
        subline: 'Heute freigegeben?',
        endpoint: '/api/ice-skating',
        metrics: [
            { id: 'status', label: 'Status', icon: '✅', formatter: (r) => r.isOpen ? 'Offen' : 'Geschlossen' },
            { id: 'temp', label: 'Temp', icon: '🌡️', formatter: (r) => `${r.weather?.temp ?? '?'}°C` },
            { id: 'eta', label: 'Anfahrt', icon: '🚗', formatter: (r) => `${r.distance ?? '?'} min` }
        ],
        prefs: [
            { id: 'natural', label: 'Natur-Eis', icon: '🌲' },
            { id: 'indoor', label: 'Eissporthalle', icon: '🏟️' },
            { id: 'near', label: 'In der Nähe', icon: '📍' }
        ]
    },
    sled: {
        id: 'sled',
        label: 'Rodeln',
        icon: '🛷',
        subline: 'Heute rodelbar?',
        endpoint: '/api/sledding',
        metrics: [
            { id: 'snow', label: 'Schnee', icon: '❄️', formatter: (r) => `${r.snow ?? 0} cm` },
            { id: 'length', label: 'Länge', icon: '📏', formatter: (r) => `${r.length ?? 0} km` },
            { id: 'eta', label: 'Anfahrt', icon: '🚗', formatter: (r) => `${r.distance ?? '?'} min` }
        ],
        prefs: [
            { id: 'fast', label: 'Rasant', icon: '🔥' },
            { id: 'family', label: 'Familie', icon: '👨‍👩‍👧' },
            { id: 'lift', label: 'Mit Lift', icon: '🚠' }
        ]
    },
    walk: {
        id: 'walk',
        label: 'Winterwanderung',
        icon: '🚶',
        subline: 'Gut begehbar?',
        endpoint: '/api/winter-walks',
        metrics: [
            { id: 'weather', label: 'Wetter', icon: '⛅', formatter: (r) => r.weather?.icon ?? '?' },
            { id: 'duration', label: 'Dauer', icon: '⏱️', formatter: (r) => `${r.duration ?? 0} h` },
            { id: 'eta', label: 'Anfahrt', icon: '🚗', formatter: (r) => `${r.distance ?? '?'} min` }
        ],
        prefs: [
            { id: 'sunny', label: 'Sonnig', icon: '☀️' },
            { id: 'easy', label: 'Leicht', icon: '🍀' },
            { id: 'view', label: 'Aussicht', icon: '🏔️' }
        ]
    }
};
