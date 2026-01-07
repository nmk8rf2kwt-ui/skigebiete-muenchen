import auth from 'basic-auth';

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
