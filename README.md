# MentorLagbe Server API 🚀

> **Backend REST API** for **MentorLagbe** (Smart Tuition & Mentorship Platform) built with Node.js, Express, MongoDB Native Driver, JWT Authentication, and Stripe Payments.

## 📌 Project Overview
MentorLagbe is a full-stack role-based EdTech platform connecting qualified Tutors offering subject-wise tuition batches with Students seeking academic guidance, moderated by Platform Admins.

- **Client Repository**: [MentorLagbe Client](https://github.com/EHMahi9/MentorLagbe-Client)
- **Live Client URL**: [https://mentorlagbe.vercel.app](https://mentorlagbe.vercel.app)
- **Live Server URL**: [https://mentorlagbe-server.onrender.com](https://mentorlagbe-server.onrender.com)

---

## 🔑 Default Test Credentials
| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@mentorlagbe.com` | `Admin@12345` | User role management, tuition moderation, transaction tracking, platform stats |
| **Tutor (Pro)** | `tutor@mentorlagbe.com` | `Tutor@12345` | Unlimited tuition posting, applicant management, active/closed toggling |
| **Tutor (Free)** | `rafiq.tutor@mentorlagbe.com` | `Tutor@12345` | Up to 2 tuition posts, applicant management |
| **Student** | `student@mentorlagbe.com` | `Student@12345` | Browse tuitions, apply, cancel pending applications, bookmark tuitions |

---

## 🛠 Tech Stack
- **Runtime**: Node.js (v24+)
- **Framework**: Express.js (v4.21+)
- **Database**: MongoDB Atlas (Native MongoDB Driver v6.12+)
- **Authentication**: JSON Web Token (JWT) + BcryptJS Password Hashing
- **Payments**: Stripe API (Checkout & Session Verification)
- **CORS & Cookies**: cors, cookie-parser, dotenv

---

## 📂 Database Architecture (4 Collections)
1. **`users`**: User profiles, credentials, role (`student` | `tutor` | `admin`), subscription tier (`free` | `pro`), and contact details.
2. **`tuitions`**: Tuition batches and 1-on-1 mentorship listings with status (`pending` | `approved` | `rejected`) and `isActive` toggle.
3. **`applications`**: Student enrollment bookings linking `tuitionId`, `tutorEmail`, and `studentEmail` with status (`pending` | `accepted` | `rejected`).
4. **`payments`**: Stripe transaction records tracking plan purchases and revenue.

---

## 🚀 Key API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` - Student / Tutor account registration (defaults to `free` plan).
- `POST /api/auth/login` - Authenticate with email/password and obtain JWT token.
- `GET /api/auth/me` - Retrieve current authenticated user profile (`verifyToken`).

### 📚 Tuitions (`/api/tuitions`)
- `GET /api/tuitions` - Public search, category filtering & server-side pagination.
- `GET /api/tuitions/featured` - 6 latest approved & active tuitions for home page.
- `GET /api/tuitions/:id` - Detailed tuition information with tutor summary.
- `POST /api/tuitions` - Create tuition listing (`verifyTutor`, enforces 2-post limit for `free` plan).
- `GET /api/tuitions/tutor/my-tuitions` - Tutor's created tuitions (`verifyTutor`).
- `PUT /api/tuitions/:id` - Edit tuition details (`verifyTutor`).
- `DELETE /api/tuitions/:id` - Delete tuition (`verifyTutor`).
- `PATCH /api/tuitions/:id/toggle-active` - Toggle active/closed status (`verifyTutor`).

### 📝 Applications (`/api/applications`)
- `POST /api/applications` - Student apply for tuition (`verifyStudent`, duplicate prevention).
- `GET /api/applications/student/my-applications` - Student's application list.
- `DELETE /api/applications/:id` - Cancel pending application (`verifyStudent`).
- `GET /api/applications/tutor/applicants` - Tutor's applicant management list (`verifyTutor`).
- `PATCH /api/applications/:id/status` - Accept or reject applicant (`verifyTutor`).

### 🛡 Admin (`/api/admin`)
- `GET /api/admin/stats` - Platform metrics and total revenue.
- `GET /api/admin/users` - All users list.
- `PATCH /api/admin/users/:id/role` - Update user role (`student` / `tutor` / `admin`).
- `GET /api/admin/tuitions` - Moderation queue.
- `PATCH /api/admin/tuitions/:id/status` - Approve / Reject tuition post.
- `GET /api/admin/transactions` - Stripe payment records.

### 💳 Payments (`/api/payments`)
- `POST /api/payments/create-checkout-session` - Initialize Stripe Checkout for Pro Plan.
- `POST /api/payments/verify-session` - Verify payment and upgrade user to `pro` plan.

### 👤 Users & Bookmarks (`/api/users`)
- `PUT /api/users/profile` - Update name, phone, bio, and profile picture.
- `GET /api/users/bookmarks` - Student saved tuitions list.
- `POST /api/users/bookmarks/:tuitionId` - Toggle bookmark for tuition.
- `GET /api/users/stats/student` - Student dashboard statistics.
- `GET /api/users/stats/tutor` - Tutor dashboard statistics.

---

## 🏃 Local Development
```bash
# Clone the repository
git clone https://github.com/EHMahi9/MentorLagbe-Server.git
cd MentorLagbe-Server

# Install dependencies
npm install

# Configure environment variables (.env)
cp .env.example .env

# Seed initial database
npm run seed

# Start server
npm run dev
```
