import dotenv from 'dotenv';
dotenv.config();

const SENTRY_API_BASE = 'https://sentry.io/api/0';

export class SentryService {
    constructor() {
        this.token = process.env.SENTRY_AUTH_TOKEN;
        this.organization = process.env.SENTRY_ORG || 'skigebiete-muenchen'; // Default or from env
        this.project = process.env.SENTRY_PROJECT || 'backend'; // Default or from env
    }

    async getIssues(limit = 5) {
        if (!this.token) {
            console.warn('⚠️ Sentry Service: No SENTRY_AUTH_TOKEN found in .env');
            return { error: 'Sentry token missing in configuration' };
        }

        const url = `${SENTRY_API_BASE}/projects/${this.organization}/${this.project}/issues/?limit=${limit}&query=is:unresolved`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const err = await response.text();
                console.error(`Sentry API Error: ${response.status} ${err}`);
                return { error: `Sentry API returned ${response.status}` };
            }

            const issues = await response.json();

            // Map to simple format for dashboard
            return issues.map(issue => ({
                id: issue.id,
                title: issue.title,
                count: issue.count,
                lastSeen: issue.lastSeen,
                permalink: issue.permalink,
                level: issue.level,
                culprit: issue.culprit
            }));

        } catch (error) {
            console.error('Failed to fetch Sentry issues:', error);
            return { error: 'Internal Server Error fetching Sentry data' };
        }
    }
}

export const sentryService = new SentryService();
