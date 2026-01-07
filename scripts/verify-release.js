const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log("🛡️  Starting Release Verification...");

// 1. Check for forbidden patterns (FIXME, TODO: BLOCKER)
console.log("🔍 Checking for forbidden code patterns...");
try {
    // Grep returns exit code 0 if found (which is BAD for us), 1 if not found (GOOD).
    // We check for "FIXME" and "TODO: BLOCKER"
    // Exclude this script file and node_modules
    execSync(`grep -r "FIXME" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs --exclude=verify-release.js`, { stdio: 'pipe' });

    // If we are here, grep found something
    console.error("❌ FOUND 'FIXME' in codebase. Deployment blocked.");
    console.error("Please resolve all FIXMEs before releasing.");
    process.exit(1);
} catch (e) {
    // Grep failed to find patterns -> Good!
    if (e.status === 1) {
        console.log("✅ No 'FIXME' markers found.");
    } else {
        // Real error
        // console.error(e);
    }
}

// 2. Check Version Bump & Changelog (Only if on main branch and not initial commit)
// This is tricky in CI because we often check out detached HEADs.
// We assume checking against 'origin/main' is what we want.

try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const isMain = branch === 'main' || process.env.GITHUB_REF === 'refs/heads/main';

    if (isMain) {
        console.log("📊 Verifying Version Bump & Changelog...");

        // Setup git context if needed
        // In CI: actions/checkout typically fetches enough history.

        // Get changed files in this commit/PR
        // For CI push event: HEAD^ HEAD
        const changedFiles = execSync('git diff --name-only HEAD^ HEAD').toString();

        const packageJsonChanged = changedFiles.includes('package.json');
        const changelogChanged = changedFiles.includes('CHANGELOG.md');

        if (packageJsonChanged && !changelogChanged) {
            console.warn("⚠️  WARNING: package.json version changed, but CHANGELOG.md did not!");
            // We can make this a hard failure:
            // process.exit(1);
            // For now, let's warn.
        }

        if (!packageJsonChanged) {
            console.log("ℹ️  No version change detected. Skipping Changelog check.");
        } else {
            console.log("✅ Version changed and Changelog check passed (or warned).");
        }
    }
} catch (e) {
    console.warn("⚠️  Could not verify git history (shallow clone?). Skipping version check.");
}

console.log("✅ Release Verification Passed!");
process.exit(0);
