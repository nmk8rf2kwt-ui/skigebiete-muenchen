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

## Manual Deployment

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
