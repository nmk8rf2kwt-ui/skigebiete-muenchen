
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

        // Filter
        if (this.state.filter === 'top3') {
            // Sort by score first
            data.sort((a, b) => (b.score || 0) - (a.score || 0));
            data = data.slice(0, 3);
        } else if (this.state.filter === 'open') {
            data = data.filter(r => r.liftsOpen > 0);
        }

        // Filter by Radius (if property exists and is false)
        data = data.filter(r => r.inRadius !== false);

        // Sort (if not top3, or refine sort)
        // Note: renderTable also does verify sort, but doing it here is cleaner
        // We'll leave the complex sort logic in render.js for now or move it here later.
        // For now, we return data that might need sorting in the view.
        return data;
    }
};
