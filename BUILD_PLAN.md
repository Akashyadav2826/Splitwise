# BUILD_PLAN.md — Splitwise Clone

> Derived exclusively from AI_CONTEXT.md. Do not begin coding until this plan is agreed upon.

---

## Day 1 — Foundation (Backend + Auth + Groups)

### Goal: Working API with auth, groups, and expense skeleton

### Tasks

#### 1.1 Project Scaffolding
- [ ] Init monorepo with `/client` (Vite + React + TS) and `/server` (Express + TS)
- [ ] Install all dependencies (see §1.6)
- [ ] Configure `tsconfig.json` for both workspaces
- [ ] Set up `.env` handling with `dotenv`
- [ ] Create `db/schema.sql`

#### 1.2 Database
- [ ] Run `schema.sql` against local Postgres instance
- [ ] Set up `pg` Pool in `server/src/db/pool.ts`
- [ ] Confirm connection on server start

#### 1.3 Auth Routes
- [ ] `POST /api/auth/register` — hash password, insert user, return JWT
- [ ] `POST /api/auth/login` — verify password, return JWT
- [ ] `authenticateJWT` middleware
- [ ] Global error handler middleware

#### 1.4 Group Routes
- [ ] `POST /api/groups` — create group, auto-add creator as member
- [ ] `GET /api/groups` — list caller's groups
- [ ] `GET /api/groups/:id` — group + members
- [ ] `PUT /api/groups/:id` — rename group (creator only)
- [ ] `DELETE /api/groups/:id` — delete group (creator only)
- [ ] `POST /api/groups/:id/members` — add member by userId
- [ ] `DELETE /api/groups/:id/members/:userId` — remove member

#### 1.5 User Search Route
- [ ] `GET /api/users/search?q=` — search by name or email

#### 1.6 Dependencies
**Server:**
```
express cors dotenv pg bcrypt jsonwebtoken
socket.io
@types/express @types/cors @types/pg @types/bcrypt @types/jsonwebtoken
typescript ts-node-dev
```
**Client:**
```
react react-dom react-router-dom axios socket.io-client
tailwindcss @tailwindcss/vite
typescript @types/react @types/react-dom
```

---

## Day 2 — Expenses, Splits, Settlements, Balances

### Goal: Full expense lifecycle + balance engine + settlement recording

### Tasks

#### 2.1 Split Calculator Utility
- [ ] `server/src/utils/splitCalculator.ts`
- [ ] `equal`: divide, assign penny remainder to first member
- [ ] `exact`: validate sum == total (±0.01 tolerance)
- [ ] `percentage`: validate sum == 100, convert to amounts
- [ ] `share`: compute proportional amounts from share integers

#### 2.2 Expense Routes
- [ ] `POST /api/groups/:groupId/expenses` — create expense + splits (transactional)
- [ ] `GET /api/groups/:groupId/expenses` — list with payer name
- [ ] `GET /api/groups/:groupId/expenses/:id` — detail + splits
- [ ] `PUT /api/groups/:groupId/expenses/:id` — update (delete old splits, recalculate, reinsert)
- [ ] `DELETE /api/groups/:groupId/expenses/:id` — delete (cascades splits)

#### 2.3 Balance Calculator Utility
- [ ] `server/src/utils/balanceCalculator.ts`
- [ ] Accepts groupId, returns `{ userId, userName, netAmounts: { [otherUserId]: number } }[]`
- [ ] Positive = owed to user; negative = user owes

#### 2.4 Balance Route
- [ ] `GET /api/groups/:id/balances` — group-level net balances
- [ ] `GET /api/users/me` — individual summary (aggregate across all groups)

#### 2.5 Settlement Routes
- [ ] `POST /api/groups/:groupId/settlements` — record payment
- [ ] `GET /api/groups/:groupId/settlements` — list

---

## Day 3 — Frontend + Chat + Polish + Deploy

### Goal: Full working UI, real-time chat, deployed app

### Tasks

#### 3.1 Socket.io Server
- [ ] `server/src/socket/index.ts` — attach to HTTP server
- [ ] Room: `expense:<expenseId>`
- [ ] Events: `join_expense`, `send_message`, `new_message`
- [ ] Validate JWT on `send_message`
- [ ] Persist message to `chats` table via `POST /api/expenses/:id/chats` internally

#### 3.2 Chat REST Route
- [ ] `GET /api/expenses/:expenseId/chats` — paginated history (default 50, no cursor in MVP)
- [ ] `POST /api/expenses/:expenseId/chats` — persist + emit to room

#### 3.3 Frontend Pages (in order)
- [ ] `AuthContext` + `SocketContext`
- [ ] `LoginPage` + `RegisterPage`
- [ ] `DashboardPage` — groups list + balance summary widget
- [ ] `GroupDetailPage` — tabs: Expenses | Balances | Members
- [ ] `ExpenseFormPage` — dynamic split UI (toggle split_type, member inputs)
- [ ] `ExpenseDetailPage` — splits + `ChatPanel` (Socket.io live)
- [ ] `SettleDebtPage` — form to record settlement

#### 3.4 Shared Components
- [ ] `Navbar` with logout
- [ ] `PrivateRoute` wrapper
- [ ] `ErrorBoundary`
- [ ] `LoadingSpinner`
- [ ] `BalanceTable` — color-coded (green = owed, red = owes)

#### 3.5 Deployment
- [ ] `vite build` → output to `client/dist`
- [ ] Express serves `client/dist` as static at `/`
- [ ] `Dockerfile` or platform config (Railway/Render)
- [ ] Set env vars on host
- [ ] Run `schema.sql` on production Postgres
- [ ] Smoke test all routes in production

---

## Implementation Rules

1. All SQL queries use parameterized `$1, $2` syntax — no string interpolation.
2. All expense + split inserts are wrapped in a `BEGIN / COMMIT` transaction.
3. Split amounts are always stored in `expense_splits.amount` as final currency values.
4. Socket.io messages are also persisted to the DB; the REST endpoint is the source of truth for history.
5. No code comments (per constraint).
6. TypeScript strict mode enabled.
7. All API errors return `{ error: string }` with appropriate HTTP status.
