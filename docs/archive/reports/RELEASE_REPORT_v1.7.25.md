# Release Report v1.7.25

**Date**: 2026-01-07
**Version**: v1.7.25
**Type**: Hotfix / Patch Release

## 📋 Summary
This release focuses on critical administrative fixes and UI refinements for the Admin Dashboard. It resolves a significant discrepancy in API quota tracking, fixes data mapping errors leading to "undefined" values, and optimizes the dashboard layout based on user feedback.

## 🛠 Key Changes

### 1. API Usage Accounting (Hotfix)
- **Problem**: The system was counting single API requests against the quota, but the provider (TomTom Matrix) charges per "transaction" (Origins × Destinations). This led to a massive underreporting of usage (e.g., showing 3 requests instead of ~180 transactions).
- **Fix**: Updated `backend/services/tomtom.js` and `backend/services/system/usage.js` to correctly count transactions.
- **Impact**: API usage bars in the dashboard now reflect reality (e.g. ~2000/2500), triggering appropriate warnings.

### 2. Dashboard Data Integrity
- **Problem**: The "Live Data Status" table showed `undefined` for Country and Lift Stats because the backend was filtering these fields out before sending to frontend.
- **Fix**: Updated `backend/routes/admin.js` to pass the full resort object.
- **Impact**: All columns (Country 🇩🇪/🇦🇹, Lifts, Schedule) are now correctly populated.

### 3. Dashboard UX/UI
- **Layout Change**: Reordered dashboard sections for better workflow:
    - **Top Left**: Server Logs (Live Tail) - Immediate visibility of errors.
    - **Top Right**: System & Cache - Quick access to maintenance tools.
- **Visuals**: Added color-coded differentiation for API providers (TomTom = Blue, ORS = Orange) in the usage breakdown.

## ✅ Verification Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Backend** | 🟢 Passed | Unit tests & manual verification of usage counting. |
| **Frontend** | 🟢 Passed | Dashboard renders correctly, no console errors. |
| **API Tracking** | 🟢 Passed | Counts increment correctly per batch request. |
| **Deploy** | 🚀 Pushed | Committed to `main` and tagged `v1.7.25`. |

## 🚀 Deployment
Code has been pushed to the repository. The CI/CD pipeline should automatically deploy this version to Render.com.

```bash
git push origin v1.7.25
```
