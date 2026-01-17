---
description: Deploy the application to production
---

## Automatic Deployment (Recommended)
Deployments are triggered automatically when pushing to main:
1. GitHub Actions CI runs (lint, test)
2. If successful, Render deploy is triggered via Deploy Hook
3. GitHub Pages is updated by Render

**Required Setup (one-time):**
Add `RENDER_DEPLOY_HOOK` to GitHub Secrets:
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add new secret: `RENDER_DEPLOY_HOOK`
3. Value: Your Render Deploy Hook URL from Render Dashboard → Settings

---

## Render CLI (Manual Deployment)

### Setup (one-time)
```bash
# Install via Homebrew
brew install render

# Login (opens browser for authentication)
render login
```

### Deploy Commands
```bash
# Trigger deploy (interactive)
render deploys create

# Trigger deploy with service ID (non-interactive)
render deploys create srv-d58i8femcj7s73chf9t0

# Deploy and wait for completion
render deploys create srv-d58i8femcj7s73chf9t0 --wait

# View deploy logs
render deploys list srv-d58i8femcj7s73chf9t0
```

### Other Useful Commands
```bash
# List all services
render services

# SSH into running service
render ssh srv-d58i8femcj7s73chf9t0

# View service logs
render logs srv-d58i8femcj7s73chf9t0
```

---

## Git-based Deployment

1. Check status of changed files
   // turbo
   git status

2. Stage all changes (Review files before approving)
   git add .

3. Commit changes (Edit the message below to describe your changes)
   git commit -m "feat: deployment update"

4. Push to main to trigger automatic deployment
   // turbo
   git push origin main

5. Open the live site to verify
   // turbo
   open https://nmk8rf2kwt-ui.github.io/skigebiete-muenchen/
