export const DOMAIN_CONFIGS = {
    ski: {
        id: 'ski',
        label: 'Skifahren',
        icon: '🎿',
        subline: 'Heute sinnvoll?',
        endpoint: '/api/resorts',
        metrics: [
            {
                id: 'lifts',
                label: 'Offen',
                icon: '🚠',
                formatter: (r) => {
                    const total = r.liftsTotal || r.lifts || 0;
                    const open = r.liftsOpen ?? 0;
                    if (total === 0) return '-';
                    const pct = Math.round((open / total) * 100);
                    return `${open}/${total} (${pct}%)`;
                }
            },
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
                    const text = typeof w === 'string' ? w : (w.description || w.desc || '');

                    if (text.includes('☀') || text.includes('🌞')) return '☀️';
                    if (text.includes('🌤')) return '🌤️';
                    if (text.includes('⛅')) return '⛅';
                    if (text.includes('☁')) return '☁️';
                    if (text.includes('🌧')) return '🌧️';
                    if (text.includes('🌨')) return '🌨️';
                    if (text.includes('❄')) return '❄️';
                    if (text.includes('🌫')) return '🌫️';
                    if (text.includes('⛈')) return '⛈️';

                    const lowerText = text.toLowerCase();
                    if (lowerText.includes('klar') || lowerText.includes('sonne')) return '☀️';
                    if (lowerText.includes('schnee') || lowerText.includes('snow')) return '❄️';
                    if (lowerText.includes('regen') || lowerText.includes('rain')) return '🌧️';
                    if (lowerText.includes('wolke') || lowerText.includes('cloud') || lowerText.includes('bedeckt')) return '☁️';

                    return '🌤️';
                },
                formatter: (r) => {
                    const w = r.weather;
                    if (!w) return '-';
                    let temp = '';
                    if (typeof w === 'object' && w.tempMax !== undefined && w.tempMin !== undefined) {
                        temp = `<div style="font-size:0.75em; color:#666; font-weight:normal;">${Math.round(w.tempMax)}° / ${Math.round(w.tempMin)}°</div>`;
                    } else if (typeof w === 'object' && w.temp !== undefined) {
                        temp = `<div style="font-size:0.75em; color:#666; font-weight:normal;">${w.temp}°C</div>`;
                    }
                    return `${temp || 'n/a'}`;
                }
            },
            {
                id: 'size',
                label: 'Größe',
                icon: '🏔️',
                formatter: (r) => `${r.piste_km || 0} km`
            },
            {
                id: 'price',
                label: 'Tagespass',
                icon: '💶',
                formatter: (r) => r.price ? `${r.price}€` : '-'
            },
            {
                id: 'eta',
                label: 'Anfahrt',
                icon: '🚗',
                formatter: (r) => `${Math.round((r.traffic?.duration || 0) / 60 || r.distance || 0)} min`
            }
        ],
        prefs: [
            { id: 'travel', label: 'Schnell', icon: '🚀' },
            { id: 'conditions', label: 'Top Pisten', icon: '✨' },
            { id: 'weather', label: 'Wetter', icon: '☀️' },
            { id: 'large', label: 'Groß', icon: '🏔️' },
            { id: 'easy', label: 'Einfach', icon: '😌' },
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
