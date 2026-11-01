# Backend Middleware
This directory contains route protection and request preprocessing utilities:
- `authMiddleware.js` (Phase 2): Verifies session tokens / cookies and attaches authenticated user identity.
- `roleMiddleware.js` (Phase 2): Asserts specific user roles (`coach`, `player`, `scout`).

