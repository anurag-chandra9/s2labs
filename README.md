# SkillBridge Attendance Management System

Full-stack attendance management system for a fictional state-level skilling programme with role-based access control for 5 user types.

## 🚀 Live URLs

- **Frontend**: (Deploy to Vercel)
- **Backend API**: (Deploy to Railway/Render)

## 👥 Test Accounts

After setting up Clerk, create test users with these roles in `public_metadata`:

| Role | Email | Role Value |
|------|-------|------------|
| Student | student@test.com | `student` |
| Trainer | trainer@test.com | `trainer` |
| Institution | institution@test.com | `institution` |
| Programme Manager | manager@test.com | `programme_manager` |
| Monitoring Officer | officer@test.com | `monitoring_officer` |

## 🛠️ Tech Stack

**Frontend:**
- React 19 + Vite
- React Router DOM (client-side routing)
- Clerk (authentication)
- Axios (API calls)
- CSS (custom styling, no framework)

**Backend:**
- Node.js + Express
- Prisma ORM
- PostgreSQL (Neon)
- Clerk SDK (auth + webhooks)

**Why these choices:**
- **Clerk**: Handles auth + user management out of the box, syncs users via webhooks
- **Prisma**: Type-safe ORM with great migration tooling
- **Neon**: Serverless Postgres with generous free tier, perfect for prototypes
- **Vite**: Fast dev server, modern build tool
- **No UI framework**: Assignment prioritizes functionality over polish

## 📦 Local Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend (in separate terminal)
cd frontend
npm install
```

### 2. Database Setup (Neon)

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string from dashboard
4. Update `backend/.env`:

```env
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

5. Run migration:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Clerk Setup

1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Enable **Email** authentication
4. Go to **Configure → User & Authentication → Metadata** → add `role` field to public metadata
5. Copy keys:

**Backend** (`backend/.env`):
```env
CLERK_SECRET_KEY="sk_test_..."
FRONTEND_URL="http://localhost:5173"
```

**Frontend** (`frontend/.env`):
```env
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
VITE_API_URL="http://localhost:5000/api"
```

6. **Set up webhook** (for user sync):
   - Go to **Configure → Webhooks**
   - Add endpoint: `http://localhost:5000/api/webhooks/clerk` (use ngrok for local dev)
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`

### 4. Run

```bash
# Backend (from backend/)
npm run dev

# Frontend (from frontend/)
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

## 📐 Database Schema

```prisma
User (id, name, email, role, institutionId)
├─ Role: student | trainer | institution | programme_manager | monitoring_officer

Institution (id, name, address)

Batch (id, name, institutionId, inviteCode)
├─ trainers: User[] (many-to-many)
├─ students: User[] (many-to-many)

Session (id, title, batchId, trainerId, date, startTime, endTime)

Attendance (id, sessionId, studentId, status, markedAt)
├─ Status: present | absent | late
├─ Unique constraint: (sessionId, studentId)
```

**Key design decisions:**
- **Many-to-many** for batch-trainers and batch-students (Prisma implicit join tables)
- **inviteCode** on Batch for student onboarding
- **Unique constraint** on attendance prevents duplicate marks
- **Role stored in Clerk** `public_metadata`, synced to DB via webhook

## 🔌 API Endpoints

### Batches
- `GET /api/batches` — List batches (role-filtered)
- `POST /api/batches` — Create batch (trainer/institution)
- `POST /api/batches/join` — Join via invite code (student)
- `POST /api/batches/:id/invite` — Generate invite link (trainer)
- `GET /api/batches/:id/summary` — Attendance summary (institution+)

### Sessions
- `POST /api/sessions` — Create session (trainer)
- `GET /api/sessions/trainer` — Trainer's sessions
- `GET /api/sessions/student` — Student's sessions
- `GET /api/sessions/:id/attendance` — Session attendance (trainer)

### Attendance
- `POST /api/attendance/mark` — Mark attendance (student)

### Institutions
- `GET /api/institutions` — List all institutions
- `POST /api/institutions` — Create institution
- `GET /api/institutions/:id/summary` — Institution summary (PM/MO)

### Programme
- `GET /api/programme/summary` — Programme-wide summary (PM/MO)

### Webhooks
- `POST /api/webhooks/clerk` — Clerk user sync

## ✅ What's Working

- ✅ Full authentication with Clerk (signup/login/logout)
- ✅ Role-based routing (5 dashboards)
- ✅ Server-side role authorization on all endpoints
- ✅ Trainer: create batches, create sessions, generate invite links, view attendance
- ✅ Student: join batch via invite, view sessions, mark attendance
- ✅ Institution: view batches, view attendance summaries
- ✅ Programme Manager: view all institutions, drill down to batches
- ✅ Monitoring Officer: read-only programme-wide view
- ✅ Webhook sync (Clerk → local DB)
- ✅ Invite link system with unique codes
- ✅ Attendance tracking with status (present/absent/late)
- ✅ Real-time data from API (no hardcoded values)

## 🚧 What's Partial / Skipped

- ⚠️ **No tests** — time constraint, would add Jest + Supertest for API, React Testing Library for frontend
- ⚠️ **Basic error handling** — production would need structured error responses, retry logic
- ⚠️ **No pagination** — all lists load full data, would add cursor-based pagination for scale
- ⚠️ **Minimal validation** — would add Zod schemas for request validation
- ⚠️ **No email notifications** — would integrate SendGrid for invite links, attendance reminders
- ⚠️ **Institution assignment** — users with `institution` role need manual `institutionId` assignment in DB

## 🔮 What I'd Do Differently with More Time

1. **Add comprehensive tests** — API integration tests, frontend component tests, E2E with Playwright
2. **Better error boundaries** — React error boundaries, structured API error responses
3. **Optimistic UI updates** — immediate feedback before API confirms
4. **Real-time updates** — WebSocket or polling for live attendance updates
5. **Bulk operations** — mark attendance for entire batch, bulk invite generation
6. **Export functionality** — CSV/PDF export for attendance reports
7. **Search & filters** — filter sessions by date, search students by name
8. **Mobile responsive** — current design works but not optimized for mobile
9. **Accessibility audit** — ARIA labels, keyboard navigation, screen reader testing
10. **Performance optimization** — React.memo, useMemo, code splitting

## 🚀 Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard:
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_URL` (your deployed backend URL)

### Backend (Railway)

```bash
cd backend
# Connect to Railway
railway link
railway up
```

Set environment variables in Railway:
- `DATABASE_URL` (Neon connection string)
- `DATABASE_URL_UNPOOLED` (Neon direct connection)
- `CLERK_SECRET_KEY`
- `FRONTEND_URL` (your deployed frontend URL)
- `PORT=5000`

Run migration after deploy:
```bash
railway run npx prisma migrate deploy
```

### Update Clerk Webhook

After deploying backend, update webhook URL in Clerk dashboard to your production API URL.

## 📝 Notes

- **DNS issue during development**: Had to switch Mac DNS to Google (8.8.8.8) to resolve Neon hostnames
- **Prisma + Neon**: Use `directUrl` for migrations, pooler URL for queries
- **Route ordering**: Static routes (`/join`) must come before param routes (`/:id`)
- **Webhook payload**: Clerk sends raw JSON, needs Buffer parsing in Express

## 📄 License

MIT

---

**Built for SL2 Full Stack Developer Intern Assignment**  
Time spent: ~2.5 days  
Focus: Functionality over polish, as requested
