# Rollback Plan: v1.2.0 -> v1.1

In case of critical failure in v1.2.0, follow this procedure to revert to the stable v1.1 state.

## Option A: Revert Git Commit (Recommended)
If the deployment is broken, revert the changes in `main` branch:

```bash
# 1. Revert the release commit
git revert HEAD

# 2. Push immediately to trigger redeploy
git push origin main
```

## Option B: Checkout and Force Push (Emergency)
If the history is corrupted or a clean slate is needed:

```bash
# 1. Checkout the tag for v1.1 (or specific commit hash before v1.2 features)
# Assuming v1.1 was around commit 'be08b43' or prior to Toolbar changes
git checkout v1.1-stable 

# 2. Force push (Caution: This rewrites history!)
git push -f origin main
```

## Option C: Manual File Restore
Backups of key configuration files are stored in `docs/backups/` (if created manually).
Otherwise, retrieve `backend/resorts.json` and `js/app.js` from the Git history of Jan 6, 2026, 14:00.

## Verification
After rollback:
1.  Check `index.html` footer/meta for Version number (should be v1.1).
2.  Verify `backend/parsers/steinplatte.js` works (or is in previous state if that was the issue).
3.  Clear Browser Cache.
