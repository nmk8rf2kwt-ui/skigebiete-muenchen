export const DOMAIN_CONFIGS = {
    ski: {
        id: 'ski',
        label: 'Skifahren',
        icon: '🎿',
        subline: 'Heute sinnvoll?',
        endpoint: '/api/resorts',
        metrics: [
            { id: 'lifts', label: 'Offen', icon: '🚠', formatter: (r) => `${Math.round((r.liftsOpen / (r.liftsTotal || r.lifts || 1)) * 100)}%` },
            { id: 'snow', label: 'Schnee', icon: '❄️', formatter: (r) => `${r.snow?.mountain ?? 0} cm` },
            { id: 'eta', label: 'Anfahrt', icon: '🚗', formatter: (r) => `${Math.round((r.traffic?.duration || 0) / 60 || r.distance || 0)} min` }
        ],
        prefs: [
            { id: 'fast', label: 'Schnell dort', icon: '⚡' },
            { id: 'snow', label: 'Viel Schnee', icon: '❄️' },
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
