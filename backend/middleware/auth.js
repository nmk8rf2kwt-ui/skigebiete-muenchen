import auth from 'basic-auth';

// Security Warning
if (!process.env.ADMIN_PASS && process.env.NODE_ENV !== 'test') {
    console.warn("⚠️  SECURITY WARNING: Default Admin Password in use! Set ADMIN_PASS in .env.");
}

export function basicAuth(req, res, next) {
    const user = auth(req);

    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'skigebiete2026';

    if (!user || user.name !== adminUser || user.pass !== adminPass) {
        res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Authentication required.');
    }

    next();
}
