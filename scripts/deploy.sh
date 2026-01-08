#!/bin/bash

# Deployment Script für Render.com
# Dieses Script hilft beim initialen Setup und manuellen Deployment

echo "🚀 Skigebiet-Finder Deployment Script"
echo "======================================"
echo ""

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Uncommitted changes detected!"
    echo ""
    git status -s
    echo ""
    read -p "Commit changes now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
    else
        echo "❌ Deployment aborted. Please commit changes first."
        exit 1
    fi
fi

# Run tests
echo ""
echo "🧪 Running tests..."
cd backend
npm test

if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Deployment aborted."
    exit 1
fi

cd ..

echo ""
echo "✅ Tests passed!"
echo ""

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Git push failed!"
    exit 1
fi

echo ""
echo "✅ Pushed to GitHub!"
echo ""
echo "🎉 Deployment triggered!"
echo ""
echo "Next steps:"
echo "1. Render will auto-deploy backend (check: https://dashboard.render.com)"
echo "2. GitHub Pages will auto-deploy frontend"
echo ""
echo "Monitor deployment:"
echo "- Backend: https://dashboard.render.com/web/YOUR_SERVICE_ID"
echo "- Frontend: https://github.com/YOUR_USERNAME/skigebiete-muenchen/actions"
echo ""
