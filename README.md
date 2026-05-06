# SkillBridge Attendance Management System

Full-stack attendance management system for a fictional state-level skilling programme called SkillBridge. Built as a take-home assignment for SL2 Full Stack Developer Intern role.

---

## 🚀 Live URLs

- **Frontend**: https://s2labs.vercel.app
- **Backend API**: https://s2labs.onrender.com
- **API Base URL**: `https://s2labs.onrender.com/api`

---

## 👥 Test Accounts

All passwords: `Test123!`

| Role | Email | Password |
|------|-------|----------|
| Trainer | trainer@test.com | Test123! |
| Student | student1@test.com | Test123! |
| Student | student2@test.com | Test123! |
| Student | student3@test.com | Test123! |
| Institution | institution@test.com | Test123! |
| Programme Manager | manager@test.com | Test123! |
| Monitoring Officer | officer@test.com | Test123! |

**Invite codes for testing student batch join:**
- `webdev2026` → Web Development 2026 batch
- `datascience2026` → Data Science Fundamentals batch

---

## 🛠️ Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 19 + Vite | Fast dev server, modern tooling |
| Routing | React Router DOM | Standard client-side routing |
| Auth | Clerk | Handles auth out of the box, role metadata support |
| HTTP | Axios | Clean API with interceptors for auth tokens |
| Backend | Node.js + Express | Simple, fast, well-known |
| ORM | Prisma | Type-safe queries, great migration tooling |
| Database | PostgreSQL (Neon) | Serverless Postgres, generous free tier |
| Styling | Plain CSS | No framework needed for functional prototype |

---

## 📦 Local Setup

### Prerequisites
- Node.js 18+
- npm

### 1. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend (separate terminal)
cd frontend && npm install
```

### 2. Environment variables

**`backend/.env`**
```env
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
PORT=5001
CLERK_SECRET_KEY="sk_test_..."
FRONTEND_URL="http://localhost:5173"
```

**`frontend/.env`**
```env
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
VITE_API_URL="http://localhost:5001/api"
```

### 3. Database setup (Neon)

1. Create project at [neon.tech](https://neon.tech)
2. Copy both connection strings (pooler + direct) into `backend/.env`
3. Run migration:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

> **Note for macOS**: If you get `P1001 Can't reach database server`, your DNS may be blocking Neon hostnames. Fix with:
> ```bash
> sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
> ```

### 4. Clerk setup

1. Create app at [clerk.com](https://clerk.com) → enable Email/Password auth
2. Go to **Configure → Sessions → Customize session token** → add:
```json
{ "metadata": "{{user.public_metadata}}" }
```
3. Copy keys into both `.env` files

### 5. Set user roles

Use the included script to set roles on Clerk users:

```bash
cd backend
node scripts/setRole.js <clerk_user_id> trainer
node scripts/setRole.js <clerk_user_id> student
# etc.
```

Or set manually in Clerk dashboard → Users → user → Metadata → Public:
```json
{ "role": "trainer" }
```

### 6. Seed test data

```bash
cd backend
npm run seed
```

### 7. Run

```bash
# Backend (port 5001)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

---

## 📐 Database Schema

```
User          id (Clerk ID), name, email, role, institutionId
Institution   id, name, address
Batch         id, name, institutionId, inviteCode
              ↳ trainers: User[] (many-to-many via _BatchTrainers)
              ↳ students: User[] (many-to-many via _BatchStudents)
Session       id, title, batchId, trainerId, date, startTime, endTime
Attendance    id, sessionId, studentId, status, markedAt
              ↳ unique(sessionId, studentId)
```

**Key design decisions:**

- **User ID = Clerk ID** — no separate auth table, Clerk is the source of truth for identity
- **Role in Clerk `public_metadata`** — set server-side only, included in JWT via session token customization
- **Auto-sync on login** — `POST /api/users/sync` called on every login, creates/updates user in DB from token
- **inviteCode on Batch** — trainer generates a reusable code, student hits `POST /batches/:code/join`
- **Unique constraint on attendance** — `(sessionId, studentId)` prevents double-marking, uses upsert to allow updates
- **Many-to-many via Prisma implicit tables** — `_BatchTrainers` and `_BatchStudents` managed automatically

---

## 🔌 API Endpoints

All endpoints require `Authorization: Bearer <clerk_token>` header. Role violations return `403`.

| Method | Path | Who |
|--------|------|-----|
| POST | `/api/users/sync` | Any authenticated user |
| POST | `/api/batches` | trainer, institution |
| POST | `/api/batches/:id/invite` | trainer |
| POST | `/api/batches/:id/join` | student |
| GET | `/api/batches` | all roles (filtered by role) |
| GET | `/api/batches/:id/summary` | institution, programme_manager, monitoring_officer |
| POST | `/api/sessions` | trainer |
| GET | `/api/sessions/trainer` | trainer |
| GET | `/api/sessions/student` | student |
| GET | `/api/sessions/:id/attendance` | trainer |
| POST | `/api/attendance/mark` | student |
| GET | `/api/institutions` | all roles |
| GET | `/api/institutions/:id/summary` | programme_manager, monitoring_officer |
| GET | `/api/programme/summary` | programme_manager, monitoring_officer |
| POST | `/api/webhooks/clerk` | Clerk (user sync webhook) |

---

## ✅ What's Working

- Full authentication with Clerk (signup, login, logout)
- Role-based routing — each role lands on their own dashboard
- Server-side role authorization on every API endpoint (returns 403 if wrong role)
- **Trainer**: create batches, create sessions, generate invite links, view session attendance
- **Student**: join batch via invite code, view enrolled sessions, mark attendance (present/late/absent)
- **Institution**: view all batches + trainers, attendance summary per batch with % rates
- **Programme Manager**: cross-institution view, drill down to batch-level data
- **Monitoring Officer**: read-only programme-wide dashboard, no create/edit/delete buttons
- Auto user sync on login (no webhook dependency for local dev)
- Invite link system with unique codes
- Attendance upsert — students can update their status

## ⚠️ What's Partial / Skipped

- No automated tests (would add Jest + Supertest for API, RTL for frontend)
- No pagination (all data loads at once — fine for prototype scale)
- No input validation library (would add Zod)
- Webhook-based user sync works in production but requires ngrok for local dev — replaced with direct sync endpoint
- Institution users need manual `institutionId` assignment after signup

## 🔮 One Thing I'd Do Differently

Add a proper onboarding flow — right now roles are set manually via script or Clerk dashboard. In production, the signup form should let users select their role, which then calls the backend to set `publicMetadata` via Clerk's API. This would make the system fully self-service.

---

## 🚀 Deployment

### Frontend → Vercel

```bash
cd frontend && vercel --prod
```

Env vars to set in Vercel:
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_URL` (deployed backend URL)

### Backend → Railway

```bash
cd backend && railway up
```

Env vars to set in Railway:
- `DATABASE_URL`, `DATABASE_URL_UNPOOLED`
- `CLERK_SECRET_KEY`
- `FRONTEND_URL` (deployed frontend URL)
- `PORT=5001`

After deploy, run migration:
```bash
railway run npx prisma migrate deploy
```

Update Clerk webhook URL to `https://s2labs.onrender.com/api/webhooks/clerk`

---

## 📝 Dev Notes

- **Port 5000 blocked on macOS** — macOS Control Center uses port 5000 (AirPlay Receiver). Backend runs on 5001.
- **DNS issue with Neon** — ISP DNS refused to resolve `*.neon.tech`. Fixed by flushing DNS cache.
- **Prisma + Neon** — use `directUrl` for migrations, pooler URL for runtime queries.
- **Clerk session token** — must customize token at Configure → Sessions to include `public_metadata`, otherwise role isn't available in JWT.

---

*Built for SL2 Full Stack Developer Intern Assignment — ~2.5 days*
