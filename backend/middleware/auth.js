import auth from 'basic-auth';

// Security: Require credentials to be set via environment variables
if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
    if (process.env.NODE_ENV !== 'test') {
        console.error("\n" + "=".repeat(80));
        console.error("❌ CRITICAL ERROR: Admin credentials not configured!");
        console.error("   ADMIN_USER and ADMIN_PASS environment variables are required.");
        console.error("   Set these in your .env file (local) or Render.com (production).");
        console.error("=".repeat(80) + "\n");

        if (process.env.NODE_ENV === 'production') {
            throw new Error('ADMIN_USER and ADMIN_PASS must be set in production');
        }
    }
}

export function basicAuth(req, res, next) {
    const user = auth(req);

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    if (!adminUser || !adminPass) {
        return res.status(500).send('Server configuration error: Admin credentials not set.');
    }

    if (!user || user.name !== adminUser || user.pass !== adminPass) {
        res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Authentication required.');
    }

    next();
}
