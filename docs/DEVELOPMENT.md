# Development Guide

## 🚀 Setup

### Prerequisites
-   **Node.js**: v20 or higher (`node -v`)
-   **npm**: v10+ (`npm -v`)
-   **GitHub CLI**: (`gh --version`) - Recommended for CI monitoring

### Installation
```bash
git clone https://github.com/nmk8rf2kwt-ui/skigebiete-muenchen.git
cd skigebiete-muenchen
npm install
```

### Environment Config
Copy `.env.example` to `.env` in the `backend/` directory:
```bash
cp backend/.env.example backend/.env
```
Fill in the required keys (`SUPABASE_URL`, `SUPABASE_KEY`, `TOMTOM_API_KEY`).

---

## 🏃‍♂️ Running Locally

The project consists of two parts that need to run simultaneously:

1.  **Backend (API)**
    ```bash
    # Runs on localhost:3000
    PORT=3000 node backend/index.js
    ```

2.  **Frontend (Static)**
    ```bash
    # Runs on localhost:10000 (proxies /api to 3000)
    npx serve -l 10000 .
    ```

---

## 🧪 Testing Strategy

We follow a strict testing pyramid:

### 1. Unit Tests (Backend)
Test individual parsers and utility functions.
```bash
cd backend
npm test                # Run all tests
npm test -- parsers     # Run only parser tests
```

### 2. Linting (Static Analysis)
Ensure code quality and catch errors early.
```bash
# Validates strict linting rules
npm run lint
```
*Note: The CI pipeline fails on warnings!*

### 3. E2E Tests (Frontend)
Simulate user interaction using Playwright.
```bash
npx playwright test
```

---

## 🛡️ Quality Assurance Checklist

Before submitting a PR, ensure:
-   [ ] **Linting**: `npm run lint` passes without warnings.
-   [ ] **Tests**: `npm test` passes.
-   [ ] **Parser Check**: If modifying parsers, run `node backend/scripts/debug_parsers.js [resortId]` to verify output.
-   [ ] **Mobile View**: Check UI responsiveness in DevTools mobile emulation.

## 🤝 Contribution Standards

### 1. Semantic Commits
We follow the Conventional Commits specification to keep history readable.
-   **Format**: `type(scope): subject`
-   **Types**: `feat` (New feature), `fix` (Bug fix), `docs` (Documentation), `chore` (Maintenance), `refactor` (Code change without logic change).
-   **Examples**:
    -   `feat(parser): add ischgl implementation`
    -   `fix(ci): repair build pipeline`
    -   `docs: update readme architecture section`

### 2. Secret Safety (Zero Tolerance)
-   **Never** commit API keys, passwords, or credentials.
-   Use `.env` for local development (git-ignored).
-   Use GitHub Secrets / Render Env Vars for production.
-   If a secret leaks into git history, it must be revoked immediately.

## 🛠️ Tooling

### GitHub CLI (`gh`)
Use `gh` to inspect CI runs directly from your terminal:
-   `gh run list`: See recent pipeline runs.
-   `gh run view --log`: View logs of the latest run.

---

## 📝 Documentation Standard

**Strict Rule: No New Files.**
To maintain consistency, do **not** create new Markdown files in `docs/`. Instead, integrate information into the existing "Source of Truth" documents:

1.  **`ARCHITECTURE.md`**: Principles, Tech Stack, Decisions.
2.  **`DEVELOPMENT.md`**: Guide for Developers (Code, Tests, Tools).
3.  **`DEPLOYMENT.md`**: Pipelines, Hosting, Config.
4.  **`OPERATIONS.md`**: Running the system (Logs, Monitor).
5.  **`API.md`**: Interfaces.
6.  **`DATA_STATUS.md`**: Business Data coverage.

Exceptions must be explicitly approved by specific user request.
