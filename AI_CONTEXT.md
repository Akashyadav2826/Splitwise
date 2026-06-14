# AI_CONTEXT.md — Splitwise Clone: Source of Truth

> Last updated: Initial generation
> Any evaluator can paste this file into an AI tool and recreate a similar app.

---

## 1. Project Overview

A Splitwise-inspired expense-splitting web application built as a 3-day internship assignment. The goal is a working, deployed MVP that covers the core loops: group creation, expense tracking, real-time chat on expenses, balance visibility, and debt settlement.

---

## 2. MVP Feature Scope (IN)

| # | Feature | Notes |
|---|---------|-------|
| 1 | Login / Register | JWT-based email + password |
| 2 | Create & manage groups | Invite, add, remove members |
| 3 | Create & manage expenses | Split equally, unequally (exact), by percentage, by share |
| 4 | Expense-level chat | Real-time via Socket.io |
| 5 | Group-wise balance summary | Who owes whom within a group |
| 6 | Individual balance summary | Across all groups for the logged-in user |
| 7 | Settle debts / record payments | Creates a Settlement record |

---

## 3. Out-of-Scope (for MVP)

- OAuth / social login
- Email verification / password reset
- Push / email notifications
- Recurring expenses
- Multi-currency support
- File/receipt uploads
- Activity feed / audit log
- Mobile-native app (web responsive is fine)
- Soft-delete / undo

---

## 4. User Personas

- **Primary**: Small groups of friends or housemates splitting shared bills.
- **Secondary**: Travel groups doing trip expense tracking.
- All users must be registered; no guest mode.

---

## 5. Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React (TypeScript) |
| Backend | Node.js + Express (TypeScript) |
| Database | PostgreSQL (relational only) |
| Real-time | Socket.io (WebSocket) |
| Auth | JWT (access token in Authorization header) |
| Styling | Tailwind CSS |
| Build tool | Vite (frontend) |

---

## 6. Data Model (PostgreSQL)

### 6.1 Tables

```sql
users(id, name, email, password_hash, created_at)
groups(id, name, created_by, created_at)
group_members(group_id, user_id, joined_at)
expenses(id, group_id, paid_by_user_id, amount, description, split_type, created_at)
expense_splits(id, expense_id, user_id, amount)
settlements(id, payer_id, payee_id, group_id, amount, created_at)
chats(id, expense_id, user_id, message, created_at)
```

### 6.2 Column Details

**users**
- `id` SERIAL PRIMARY KEY
- `name` VARCHAR(100) NOT NULL
- `email` VARCHAR(255) UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL
- `created_at` TIMESTAMPTZ DEFAULT NOW()

**groups**
- `id` SERIAL PRIMARY KEY
- `name` VARCHAR(100) NOT NULL
- `created_by` INT REFERENCES users(id)
- `created_at` TIMESTAMPTZ DEFAULT NOW()

**group_members**
- `group_id` INT REFERENCES groups(id) ON DELETE CASCADE
- `user_id` INT REFERENCES users(id) ON DELETE CASCADE
- PRIMARY KEY (group_id, user_id)
- `joined_at` TIMESTAMPTZ DEFAULT NOW()

**expenses**
- `id` SERIAL PRIMARY KEY
- `group_id` INT REFERENCES groups(id) ON DELETE CASCADE
- `paid_by_user_id` INT REFERENCES users(id)
- `amount` NUMERIC(12,2) NOT NULL
- `description` VARCHAR(255) NOT NULL
- `split_type` VARCHAR(20) NOT NULL — one of: `equal`, `exact`, `percentage`, `share`
- `created_at` TIMESTAMPTZ DEFAULT NOW()

**expense_splits**
- `id` SERIAL PRIMARY KEY
- `expense_id` INT REFERENCES expenses(id) ON DELETE CASCADE
- `user_id` INT REFERENCES users(id)
- `amount` NUMERIC(12,2) NOT NULL — always stored as final currency amount regardless of split_type

**settlements**
- `id` SERIAL PRIMARY KEY
- `payer_id` INT REFERENCES users(id)
- `payee_id` INT REFERENCES users(id)
- `group_id` INT REFERENCES groups(id)
- `amount` NUMERIC(12,2) NOT NULL
- `created_at` TIMESTAMPTZ DEFAULT NOW()

**chats**
- `id` SERIAL PRIMARY KEY
- `expense_id` INT REFERENCES expenses(id) ON DELETE CASCADE
- `user_id` INT REFERENCES users(id)
- `message` TEXT NOT NULL
- `created_at` TIMESTAMPTZ DEFAULT NOW()

---

## 7. Balance Calculation Logic

For a given group:

1. For each expense, the payer is **owed** by each split member their respective `expense_splits.amount`.
2. Settlements reduce the net balance: payer pays payee `amount`.

**Net balance per user-pair within a group:**

```
net(A→B) = Σ expense_splits where paid_by=A and split_user=B
          - Σ expense_splits where paid_by=B and split_user=A
          - Σ settlements where payer=A and payee=B
          + Σ settlements where payer=B and payee=A
```

If `net(A→B) > 0`, B owes A that amount.

**Individual balance summary**: aggregate the above across all groups the user belongs to.

**Split-type → amount conversion** (done at write time, stored as `NUMERIC`):
- `equal`: `total / n` for each member (remainder penny goes to first member)
- `exact`: client provides exact amounts, server validates sum == total
- `percentage`: client provides percentages, server converts to amounts, validates sum == 100
- `share`: client provides share integers, server computes `(share / totalShares) * total`

---

## 8. Authentication

- Register: POST `/api/auth/register` → returns JWT
- Login: POST `/api/auth/login` → returns JWT
- Token: stored in `localStorage` on client, sent as `Authorization: Bearer <token>`
- Middleware: `authenticateJWT` on all protected routes
- Token expiry: 7 days
- Password hashing: `bcrypt` (saltRounds=10)

---

## 9. API Design

All routes prefixed with `/api`. All responses are JSON. Authenticated routes require `Authorization: Bearer <token>`.

### Auth
```
POST /api/auth/register   { name, email, password }
POST /api/auth/login      { email, password }
```

### Users
```
GET  /api/users/search?q=   search by name/email (for adding to groups)
GET  /api/users/me          current user profile + global balance summary
```

### Groups
```
GET    /api/groups               list groups for current user
POST   /api/groups               create group { name, memberIds[] }
GET    /api/groups/:id           group details + members
PUT    /api/groups/:id           update group name
DELETE /api/groups/:id           delete group (creator only)
POST   /api/groups/:id/members   add member { userId }
DELETE /api/groups/:id/members/:userId  remove member
GET    /api/groups/:id/balances  net balances within group
```

### Expenses
```
GET    /api/groups/:groupId/expenses         list expenses in group
POST   /api/groups/:groupId/expenses         create expense
GET    /api/groups/:groupId/expenses/:id     expense detail + splits
PUT    /api/groups/:groupId/expenses/:id     update expense
DELETE /api/groups/:groupId/expenses/:id     delete expense
```

### Chats
```
GET  /api/expenses/:expenseId/chats   fetch chat history
POST /api/expenses/:expenseId/chats   post message (also emitted via Socket.io)
```

### Settlements
```
POST /api/groups/:groupId/settlements   record settlement { payerId, payeeId, amount }
GET  /api/groups/:groupId/settlements   list settlements
```

---

## 10. Socket.io (Real-time Chat)

- Server emits/listens on namespace `/chat`
- Client joins room `expense:<expenseId>` on opening an expense
- Events:
  - `join_expense` (client → server): `{ expenseId, token }`
  - `new_message` (server → room): `{ id, expenseId, userId, userName, message, createdAt }`
  - `send_message` (client → server): `{ expenseId, message, token }`
- Auth: token is verified on `send_message`; unauthenticated emits are dropped

---

## 11. Frontend Architecture

### Route Map

```
/                    → redirect to /dashboard if authed, else /login
/login               → Login page
/register            → Register page
/dashboard           → All groups + individual balance summary
/groups/new          → Create group form
/groups/:id          → Group detail: members, expenses, balances tab
/groups/:id/expenses/new  → Create expense form
/groups/:id/expenses/:eid → Expense detail + chat panel
/groups/:id/settle   → Settle debt form
```

### Component Tree (key components)

```
App
├── AuthProvider (context)
├── SocketProvider (context)
├── Routes
│   ├── LoginPage
│   ├── RegisterPage
│   ├── DashboardPage
│   │   ├── GroupCard
│   │   └── BalanceSummary
│   ├── GroupDetailPage
│   │   ├── MemberList
│   │   ├── ExpenseList → ExpenseCard
│   │   ├── BalanceTable
│   │   └── AddMemberModal
│   ├── ExpenseFormPage
│   └── ExpenseDetailPage
│       ├── SplitViewer
│       └── ChatPanel
│           ├── MessageList
│           └── MessageInput
```

### State Management

- React Context for auth (user, token)
- React Context for socket instance
- Local component state + `useEffect` for data fetching
- No Redux; keep it simple

---

## 12. Project Structure

```
/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── api/             # axios instance + per-resource functions
│   │   ├── components/      # shared UI components
│   │   ├── contexts/        # AuthContext, SocketContext
│   │   ├── pages/           # page-level components
│   │   ├── types/           # TypeScript interfaces
│   │   └── main.tsx
│   └── vite.config.ts
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/          # auth, groups, expenses, chats, settlements, users
│   │   ├── middleware/       # authenticateJWT, errorHandler
│   │   ├── db/              # pg pool, query helpers
│   │   ├── socket/          # Socket.io setup
│   │   ├── utils/           # balance calculator, split calculator
│   │   └── index.ts
│   └── tsconfig.json
├── db/
│   └── schema.sql           # canonical schema
├── AI_CONTEXT.md
└── BUILD_PLAN.md
```

---

## 13. Deployment

- **Target**: Single server (e.g., Railway, Render, or VPS)
- **Frontend**: Built with `vite build`, served as static files by Express from `/client/dist`
- **Backend**: Express serves both API and static frontend
- **Database**: PostgreSQL instance (managed, e.g., Railway Postgres or Supabase)
- **Environment variables**:
  - `DATABASE_URL` — PostgreSQL connection string
  - `JWT_SECRET` — secret for signing tokens
  - `PORT` — server port (default 3000)
  - `CLIENT_ORIGIN` — for CORS (in dev)

---

## 14. Known Risks & Tradeoffs

| Risk | Mitigation |
|------|-----------|
| Penny rounding on equal splits | Assign remainder to first member in split list |
| Concurrent expense edits | Last-write-wins (no optimistic locking in MVP) |
| Socket auth on reconnect | Re-join room with token on reconnect event |
| Large group balance recalc | Calculate on-demand per request (no caching in MVP) |
| SQL injection | Use parameterized queries (`pg` library) throughout |

---

## 15. Testing (MVP)

- Manual smoke tests covering each API route
- No automated test suite in MVP (out of scope for 3-day build)

---

## 16. Implementation Notes

### Known Build Details
- Frontend uses Vite's `verbatimModuleSyntax` — all type imports must use `import type` or inline `type` keyword.
- Backend `bcrypt` must be installed with `--ignore-scripts` in sandboxed/Docker environments; JS fallback works correctly.
- Socket.io server is attached to the raw `http.Server` instance (not Express) so WebSocket upgrades work correctly.
- Express serves `client/dist` as static files — the frontend build must exist before starting in production.
- Expense splits always stored as final `NUMERIC(12,2)` currency values; conversion from percentage/share happens in `splitCalculator.ts`.
- Balance calculator uses a symmetric key `min(a,b)_max(a,b)` to accumulate net amounts, avoiding double-counting.

### File Locations
- `db/schema.sql` — canonical PostgreSQL schema, run once to initialize
- `server/src/utils/splitCalculator.ts` — pure split logic, no DB dependency
- `server/src/utils/balanceCalculator.ts` — DB-backed balance aggregation
- `server/src/socket/index.ts` — Socket.io init + `getIO()` singleton
- `client/src/contexts/AuthContext.tsx` — JWT + user state, persisted to localStorage
- `client/src/contexts/SocketContext.tsx` — single Socket.io connection, re-created on auth change

## 17. Change Log

| Date | Change |
|------|--------|
| Day 0 | Initial context generated from spec |
| Day 0 | Full implementation complete — frontend + backend + DB schema |
| Day 0 | Fixed verbatimModuleSyntax TS errors in all frontend files |
| Day 0 | Frontend build verified clean (119 modules, 346KB JS bundle) |
| Day 0 | Backend TypeScript verified clean (zero errors) |
