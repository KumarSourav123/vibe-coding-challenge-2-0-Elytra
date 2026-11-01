# API CONTRACT SPECIFICATIONS
## Sports Academy Management System

---

## 1. Global Standards

### 1.1 Response Envelope Structure

All API responses follow a strict, unified envelope structure.

#### Successful Response (`2xx`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

#### Error Response (`4xx` / `5xx`)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Detailed error description"
  ]
}
```

---

## 2. API Endpoints Specification

### 2.1 Health Check (Phase 1)

#### `GET /api/health`
- **Purpose**: Verify backend system and MongoDB Atlas connectivity.
- **Backend Owner**: Backend Developer
- **Frontend Consumer**: Health Status Component / Landing Page
- **Auth Required**: No
- **Required Role**: Public
- **Request Parameters**: None
- **Request Body**: None
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "System and database are healthy",
    "data": {
      "status": "healthy",
      "database": "connected",
      "timestamp": "2026-11-01T20:30:00.000Z"
    }
  }
  ```
- **Error Response (`503 Service Unavailable`)**:
  ```json
  {
    "success": false,
    "message": "Database connection failed or not configured",
    "errors": [
      "MONGODB_URI is not defined. Please set it in your .env.local file."
    ],
    "data": {
      "status": "degraded",
      "database": "disconnected",
      "timestamp": "2026-11-01T20:30:00.000Z"
    }
  }
  ```
- **Test Scenarios**:
  1. Return `200` with `database: "connected"` when MongoDB Atlas is accessible.
  2. Return `503` with `database: "disconnected"` when `MONGODB_URI` is missing or invalid.

---

### 2.2 Authentication & User Management (Phase 2)

#### `POST /api/auth/login`
- **Purpose**: Authenticate user and issue secure HTTP-only session cookie / token.
- **Backend Owner**: Backend Developer
- **Frontend Consumer**: Login Form (`/login`)
- **Auth Required**: No
- **Required Role**: Public
- **Request Body**:
  ```json
  {
    "email": "coach@academy.com",
    "password": "SecurePassword123"
  }
  ```
- **Validation Rules**:
  - `email`: Valid email format, required.
  - `password`: String, min 6 characters, required.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Logged in successfully",
    "data": {
      "user": {
        "id": "6724fa10b45a9010ef8c3401",
        "name": "Alex Ferguson",
        "email": "coach@academy.com",
        "role": "coach"
      }
    }
  }
  ```
- **Error Response (`401 Unauthorized`)**:
  ```json
  {
    "success": false,
    "message": "Invalid email or password",
    "errors": ["Authentication failed"]
  }
  ```

#### `GET /api/auth/me`
- **Purpose**: Retrieve currently authenticated session identity.
- **Auth Required**: Yes
- **Required Role**: `coach`, `player`, `scout`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "User session active",
    "data": {
      "user": {
        "id": "6724fa10b45a9010ef8c3401",
        "name": "Alex Ferguson",
        "email": "coach@academy.com",
        "role": "coach"
      }
    }
  }
  ```

---

### 2.3 Player Management (Phase 3)

#### `POST /api/players`
- **Purpose**: Coach adds a new player.
- **Auth Required**: Yes
- **Required Role**: `coach`
- **Request Body**:
  ```json
  {
    "name": "Marcus Rashford",
    "age": 19,
    "sport": "football"
  }
  ```
- **Validation Rules**:
  - `name`: Non-empty string, trimmed.
  - `age`: Positive integer, minimum 1.
  - `sport`: Non-empty string, trimmed.
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Player created successfully",
    "data": {
      "id": "6724fa10b45a9010ef8c3410",
      "name": "Marcus Rashford",
      "age": 19,
      "sport": "football",
      "createdAt": "2026-11-01T20:45:00.000Z"
    }
  }
  ```

#### `GET /api/players`
- **Purpose**: List players (coach view all; scout sees ready players).
- **Auth Required**: Yes
- **Required Role**: `coach`, `scout`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Players retrieved successfully",
    "data": {
      "players": [
        {
          "id": "6724fa10b45a9010ef8c3410",
          "name": "Marcus Rashford",
          "age": 19,
          "sport": "football",
          "attendancePercentage": 85.5,
          "matchesPlayed": 3,
          "isReady": true
        }
      ]
    }
  }
  ```

---

### 2.4 Practice Sessions & Attendance (Phase 4)

#### `POST /api/sessions`
- **Purpose**: Coach creates a new practice session.
- **Auth Required**: Yes
- **Required Role**: `coach`
- **Request Body**:
  ```json
  {
    "date": "2026-11-02T10:00:00.000Z",
    "sport": "football"
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Practice session created",
    "data": {
      "id": "6724fb20b45a9010ef8c3420",
      "date": "2026-11-02T10:00:00.000Z",
      "sport": "football",
      "status": "open",
      "attendance": []
    }
  }
  ```

#### `POST /api/sessions/:id/attendance`
- **Purpose**: Coach records player attendance for an open session.
- **Auth Required**: Yes
- **Required Role**: `coach`
- **Request Body**:
  ```json
  {
    "attendance": [
      { "playerId": "6724fa10b45a9010ef8c3410", "status": "present" },
      { "playerId": "6724fa10b45a9010ef8c3411", "status": "absent" }
    ]
  }
  ```
- **Business Rule Check**:
  - Rejects if session status is `'closed'` (`400 Bad Request`).
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Attendance marked successfully",
    "data": {
      "sessionId": "6724fb20b45a9010ef8c3420",
      "status": "open",
      "recordsCount": 2
    }
  }
  ```

#### `POST /api/sessions/:id/close`
- **Purpose**: Coach closes a practice session, locking it permanently.
- **Auth Required**: Yes
- **Required Role**: `coach`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Practice session closed successfully",
    "data": {
      "id": "6724fb20b45a9010ef8c3420",
      "status": "closed",
      "closedAt": "2026-11-02T11:30:00.000Z"
    }
  }
  ```

---

### 2.5 Matches & Scoring (Phase 5)

#### `POST /api/matches`
- **Purpose**: Coach creates a match and records participating player scores.
- **Auth Required**: Yes
- **Required Role**: `coach`
- **Request Body**:
  ```json
  {
    "date": "2026-11-02T16:00:00.000Z",
    "sport": "football",
    "opponent": "Apex Academy",
    "participatingPlayers": [
      { "playerId": "6724fa10b45a9010ef8c3410", "score": 2 }
    ]
  }
  ```
- **Validation Rules**:
  - Validates that every `playerId` was marked **`present`** in a closed practice session for that exact date and sport.
  - Rejects absent or non-attending players with `400 Bad Request`.
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Match created and scores recorded",
    "data": {
      "id": "6724fc30b45a9010ef8c3430",
      "date": "2026-11-02T16:00:00.000Z",
      "sport": "football",
      "opponent": "Apex Academy",
      "participatingPlayers": [
        { "playerId": "6724fa10b45a9010ef8c3410", "score": 2 }
      ]
    }
  }
  ```

---

### 2.6 Readiness & Role Dashboards (Phase 6)

#### `GET /api/scout/players`
- **Purpose**: Scout views only players who satisfy the readiness rule.
- **Readiness Rule**:
  $$\text{Attendance} \ge 75\% \land \text{Matches Played} \ge 2$$
- **Auth Required**: Yes
- **Required Role**: `scout`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Ready players retrieved",
    "data": {
      "players": [
        {
          "id": "6724fa10b45a9010ef8c3410",
          "name": "Marcus Rashford",
          "sport": "football",
          "age": 19,
          "attendancePercentage": 80.0,
          "matchesPlayed": 2,
          "isReady": true
        }
      ]
    }
  }
  ```

#### `GET /api/player/dashboard`
- **Purpose**: Player accesses their own records only.
- **Auth Required**: Yes
- **Required Role**: `player`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Player dashboard data retrieved",
    "data": {
      "profile": {
        "name": "Marcus Rashford",
        "sport": "football",
        "age": 19
      },
      "stats": {
        "attendancePercentage": 80.0,
        "completedSessions": 5,
        "attendedSessions": 4,
        "matchesPlayed": 2,
        "totalScore": 5,
        "isReady": true
      },
      "attendanceHistory": [],
      "matchHistory": []
    }
  }
  ```

