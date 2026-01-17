import dotenv from 'dotenv';
dotenv.config();

const SENTRY_API_BASE = 'https://sentry.io/api/0';

export class SentryService {
    constructor() {
        this.token = process.env.SENTRY_AUTH_TOKEN;
        this.organization = process.env.SENTRY_ORG || 'skigebiete-muenchen';
        // Support multiple projects: comma-separated (e.g., "backend,javascript-frontend")
        const projectsEnv = process.env.SENTRY_PROJECTS || process.env.SENTRY_PROJECT || 'backend';
        this.projects = projectsEnv.split(',').map(p => p.trim()).filter(Boolean);
    }

    /**
     * Fetch issues from a single project
     */
    async fetchProjectIssues(project, limit = 5) {
        const url = `${SENTRY_API_BASE}/projects/${this.organization}/${project}/issues/?limit=${limit}&query=is:unresolved`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`Sentry API Error for ${project}: ${response.status} ${err}`);
            throw new Error(`Sentry API returned ${response.status} for project "${project}"`);
        }

        const issues = await response.json();

        // Map to simple format with project tag
        return issues.map(issue => ({
            id: issue.id,
            title: issue.title,
            count: issue.count,
            lastSeen: issue.lastSeen,
            permalink: issue.permalink,
            level: issue.level,
            culprit: issue.culprit,
            project: project // Tag with project name
        }));
    }

    /**
     * Fetch issues from all configured projects
     */
    async getIssues(limit = 5) {
        if (!this.token) {
            console.warn('⚠️ Sentry Service: No SENTRY_AUTH_TOKEN found in .env');
            return { error: 'Sentry token missing in configuration' };
        }

        try {
            // Fetch from all projects in parallel
            const results = await Promise.allSettled(
                this.projects.map(project => this.fetchProjectIssues(project, limit))
            );

            // Collect all issues and errors
            const allIssues = [];
            const errors = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    allIssues.push(...result.value);
                } else {
                    errors.push(`${this.projects[index]}: ${result.reason.message}`);
                }
            });

            // If all failed, return error
            if (allIssues.length === 0 && errors.length > 0) {
                return { error: errors.join('; ') };
            }

            // Sort by lastSeen (most recent first) and limit
            allIssues.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

            // Log any partial errors
            if (errors.length > 0) {
                console.warn('Sentry partial errors:', errors);
            }

            return allIssues.slice(0, limit * 2); // Return up to 2x limit for combined view

        } catch (error) {
            console.error('Failed to fetch Sentry issues:', error);
            return { error: 'Internal Server Error fetching Sentry data' };
        }
    }
}

export const sentryService = new SentryService();
