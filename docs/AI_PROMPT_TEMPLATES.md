# AI PROMPT TEMPLATES
## Sports Academy Management System

Reusable standardized prompts for AI coding assistants working on the project.

---

## 1. Master Instructions Kickoff Prompt
```text
I am working on the Sports Academy Management System (Vibe Coding Challenge 2.0).
My assigned role is: [BACKEND DEVELOPER | FRONTEND DEVELOPER]
Today we are implementing [PHASE NUMBER] only.
Follow all rules in MASTER_DEVELOPMENT_PROMPT.md and docs/TEAM_DEVELOPMENT_GUIDE.md.
Do not execute git operations.
Do not modify files owned by the other developer.
Strictly adhere to docs/API_CONTRACTS.md.
Let's inspect the repository first and proceed step by step.
```

---

## 2. Backend Feature Implementation Prompt
```text
Role: BACKEND DEVELOPER
Phase: [PHASE NUMBER] - [FEATURE NAME]

Tasks:
1. Review the agreed contract in docs/API_CONTRACTS.md for [ENDPOINT].
2. Implement or update the relevant Mongoose model in backend/models/.
3. Implement request validation and business rules in backend/validators/ or backend/services/.
4. Implement the Route Handler in app/api/[ROUTE]/route.js using standard response helpers from backend/utils/apiResponse.js.
5. Ensure proper error handling and status codes.
6. Verify locally with automated tests or curl/fetch scripts.
7. Update docs/FEATURE_TRACKER.md.
Do not modify frontend/ files.
```

---

## 3. Frontend Feature Implementation Prompt
```text
Role: FRONTEND DEVELOPER
Phase: [PHASE NUMBER] - [FEATURE NAME]

Tasks:
1. Review the agreed contract in docs/API_CONTRACTS.md for [ENDPOINT].
2. Create mock data in frontend/features/[FEATURE]/mocks/ matching the contract.
3. Build responsive UI components in frontend/features/[FEATURE]/ and frontend/components/.
4. Handle loading, empty, error, and success states cleanly.
5. Create an API client service in frontend/utils/ or frontend/features/[FEATURE]/services/.
6. Test UI functionality with mock data first.
7. Prepare for backend integration.
Do not modify backend/ or app/api/ files.
```

---

## 4. API Integration Prompt
```text
Role: [BACKEND / FRONTEND DEVELOPER]
Phase: Integration for [FEATURE NAME]

Tasks:
1. Verify backend endpoint [ENDPOINT] is live and returns data matching docs/API_CONTRACTS.md.
2. In frontend API service, switch source from mock data to live endpoint.
3. Test successful data flow from database to UI.
4. Test validation error handling and edge cases (e.g. network failure, 400 Bad Request).
5. Update docs/FEATURE_TRACKER.md integration status to 'INTEGRATED'.
```

---

## 5. Automated Testing & Verification Prompt
```text
Role: BACKEND DEVELOPER
Task: Verification of Compulsory Test Cases for Phase [PHASE NUMBER]

Verify scenarios:
- [List test scenarios e.g. Attendance marking, same-day match eligibility, readiness rule]
Ensure:
1. Database records are properly queried and mutated.
2. Negative test cases (e.g. absent player participating in match, modifying closed session) are rejected with appropriate error response.
3. No credentials or connection strings are leaked in error responses.
Report test results in detail.
```

---

## 6. Bug Fixing Prompt
```text
Role: [BACKEND / FRONTEND DEVELOPER]
Bug Report:
- Observed behavior: [DESCRIBE ISSUE]
- Expected behavior: [DESCRIBE EXPECTED]
- Reproduction steps: [STEPS]

Instructions:
1. Trace root cause in your owned files.
2. Formulate minimal fix preserving backward compatibility and existing API contracts.
3. Verify the fix addresses the issue without regressions.
4. If this requires an API contract modification, coordinate first and update docs/API_CONTRACTS.md.
```

---

## 7. Daily / Final Review Prompt
```text
Task: Daily Milestone Review
Phase: [PHASE NUMBER]

Review checklist:
1. Are all files properly placed according to ownership rules?
2. Does the Next.js production build pass cleanly (npm run build)?
3. Are all new endpoints documented in docs/API_CONTRACTS.md?
4. Is docs/FEATURE_TRACKER.md up to date?
5. Are secrets protected and excluded from git (.env.local in .gitignore)?
6. Provide a concise summary of changes and instructions for the other developer.
```

