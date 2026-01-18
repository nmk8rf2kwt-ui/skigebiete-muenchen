
/**
 * Simple Store pattern to manage application state
 * and avoid global variable pollution.
 */
export const store = {
    state: {
        resorts: [],
        filter: 'all',  // 'all', 'top3', 'open'
        sortKey: 'smartScore',  // Default to SmartScore
        sortDirection: 'desc',
        viewMode: 'list', // 'list', 'map'
        radius: 150, // Default radius in km
        lastUpdated: null
    },

    /**
     * Update state and notify listeners (render)
     * @param {object} partialState - New state properties
     * @param {function} renderCallback - Function to call after update
     */
    setState(partialState, renderCallback) {
        this.state = { ...this.state, ...partialState };
        if (renderCallback) renderCallback(this.state);
    },

    get() {
        return this.state;
    },

    /**
     * Get sorted and filtered resorts ready for rendering
     */
    saveUserLocation(location) {
        try {
            sessionStorage.setItem('skigebiete_user_location', JSON.stringify(location));
        } catch (e) {
            console.warn('Failed to save location', e);
        }
    },

    getUserLocation() {
        try {
            const data = sessionStorage.getItem('skigebiete_user_location');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Failed to load/parse location', e);
            return null;
        }
    },

    getProcessedResorts() {
        let data = [...this.state.resorts];

        // Filter by Radius
        // Use driving distance (distance_km) if available, otherwise linear distance (distance)
        const maxRadius = this.state.radius || 1500;
        data = data.filter(r => {
            const dist = r.distance_km || r.distance;
            // If we have no distance data yet, keep it (safe default)
            if (dist === undefined || dist === null) return true;
            return dist <= maxRadius;
        });

        // Filter by Type
        if (this.state.filter === 'top3') {
            // Sort by smartScore first (descending)
            data.sort((a, b) => (b.smartScore || b.score || 0) - (a.smartScore || a.score || 0));
            data = data.slice(0, 3);
        } else if (this.state.filter === 'open') {
            data = data.filter(r => r.liftsOpen > 0);
        }

        return data;
    }
};
