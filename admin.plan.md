# Admin Dashboard with Firebase Functions

### Overview

Build an admin-only dashboard to manage users and tenants. Backend will run on Firebase Cloud Functions (Node), using Firebase Admin SDK. Roles are stored in Firebase Auth custom claims and mirrored to Firestore for querying.

### Architecture

- Backend: Firebase Cloud Functions (HTTPS endpoints) with Admin SDK
- AuthZ: Validate ID token, require role ∈ {owner} or super admin email `admin@qayd.com`
- Roles: Auth custom claims { role, tenantId, isActive } + Firestore mirrors in `users/{uid}`
- Data model:
- `users/{uid}`: { tenantId, role, email, name, isActive }
- `tenants/{tenantId}`: { name, nameAr, stats, createdAt }
- `orders/{orderId}`: existing
- `settings/{tenantId}` (or `tenants/{tenantId}/settings/app`): tenant settings

### Cloud Functions (HTTPS REST)

- POST `/admin/users` — create user in Firebase Auth + Firestore profile
- PATCH `/admin/users/:uid` — update role, isActive (also updates Auth disabled flag and custom claims)
- DELETE `/admin/users/:uid` — remove from Auth and Firestore
- POST `/admin/users:test` — quick connectivity test (create/delete temp user)
- POST `/admin/tenants` — create tenant (and optional initial admin)
- GET `/admin/tenants` — list tenants with brief stats
- GET `/admin/tenants/:tenantId` — tenant details and quick stats
- GET `/admin/stats` — system-level aggregates (users, active/inactive, tenants, orders, revenue)
- PUT `/admin/tenants/:tenantId/settings` — create/update tenant settings

All endpoints:

- Require Bearer token; verify via Admin SDK; enforce `role===owner` OR email===`admin@qayd.com`.

### Client (React)

- Route: `src/pages/AdminDashboard.tsx` with tabs: Users, Tenants, Stats, Settings
- API client: `src/lib/adminApi.ts` to call the functions with the current user ID token
- Route guard: in `src/App.tsx` add `/admin` guarded route; fetch ID token and inspect claims; allow if role owner OR email `admin@qayd.com`

### UI Scope

- Users tab:
- Table (email, role, status, tenant)
- Actions: Add user, Change role, Enable/Disable, Delete, "Test Auth" button
- Tenants tab:
- Create tenant form, tenants list with quick stats
- Stats tab:
- Cards showing total users, active/inactive, tenants, orders, revenue
- Settings tab:
- Per-tenant settings editor (read/write)

### Security & Consistency

- On role/status change: update Auth custom claims + Firestore mirror atomically (best-effort)
- On disable: set Auth `disabled=true`, mirror Firestore `isActive=false`
- Indexes: add Firestore indexes for queries (users by role/tenant, orders by tenant)

### Notes

- Super admin bypass: `admin@qayd.com` always allowed regardless of role claim
- Created users MUST be added in Firebase Authentication (via Admin SDK createUser), then mirrored to Firestore

### To-dos

- [x] Add Firebase Functions project with Admin SDK and HTTPS endpoints
- [x] Implement token verification and access control (owner or admin@qayd.com)
- [x] Implement users CRUD endpoints with claims/mirror updates
- [x] Implement tenants create/list/detail endpoints with quick stats
- [x] Implement system aggregates endpoint
- [x] Implement tenant settings create/update endpoint
- [x] Create adminApi.ts to call functions with ID token
- [x] Add /admin route and guard in App.tsx based on claims/email
- [x] Build AdminDashboard.tsx with Users, Tenants, Stats, Settings tabs
- [x] Add Firestore indexes and update security rules to match model


