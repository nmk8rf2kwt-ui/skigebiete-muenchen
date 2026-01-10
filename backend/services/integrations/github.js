const fetch = require('node-fetch');

class GitHubService {
    constructor() {
        this.baseUrl = 'https://api.github.com/repos/nmk8rf2kwt-ui/skigebiete-muenchen';
        // Optional: Use token if available to avoid rate limits, but works without for public repos
        this.token = process.env.GITHUB_TOKEN;
    }

    async fetchLatestRun() {
        try {
            const headers = { 'User-Agent': 'Skigebiete-Muenchen-Backend' };
            if (this.token) {
                headers['Authorization'] = `token ${this.token}`;
            }

            const response = await fetch(`${this.baseUrl}/actions/runs?per_page=1`, { headers });

            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.workflow_runs || data.workflow_runs.length === 0) {
                return null;
            }

            const latest = data.workflow_runs[0];

            return {
                id: latest.id,
                name: latest.name,
                status: latest.status,         // "completed", "in_progress", "queued"
                conclusion: latest.conclusion, // "success", "failure", "neutral"
                html_url: latest.html_url,
                created_at: latest.created_at,
                updated_at: latest.updated_at,
                actor: latest.actor?.login
            };

        } catch (error) {
            console.error('Failed to fetch GitHub status:', error.message);
            return { error: error.message };
        }
    }
}

module.exports = new GitHubService();
