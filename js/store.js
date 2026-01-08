
/**
 * Simple Store pattern to manage application state
 * and avoid global variable pollution.
 */
export const store = {
    state: {
        resorts: [],
        filter: 'all',  // 'all', 'top3', 'open'
        sortKey: 'score',
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
            // Sort by score first
            data.sort((a, b) => (b.score || 0) - (a.score || 0));
            data = data.slice(0, 3);
        } else if (this.state.filter === 'open') {
            data = data.filter(r => r.liftsOpen > 0);
        }

        return data;
    }
};
