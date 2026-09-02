<div align="center">

# 🏫 MokletCare

**School Facility Incident Reporting & Maintenance Management System**  
*Built for SMK Telkom Malang ("Moklet")*

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.22-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Clerk Auth](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com/)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [1. Student & Reporter Portal](#1-student--reporter-portal)
  - [2. Staff Maintenance Dashboard](#2-staff-maintenance-dashboard)
  - [3. Administrator & Governance Panel](#3-administrator--governance-panel)
  - [4. Security & Performance](#4-security--performance)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Tech Stack](#-tech-stack)
- [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
- [Database Schema & Migrations](#-database-schema--migrations)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation Steps](#installation-steps)
  - [Environment Variables](#environment-variables)
  - [Running Database Migrations](#running-database-migrations)
  - [Starting the Application](#starting-the-application)
- [Available Scripts](#-available-scripts)
- [Route & Endpoint Reference](#-route--endpoint-reference)
- [Docker Deployment](#-docker-deployment)
- [Development Team](#-development-team)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📖 Overview

**MokletCare** is an end-to-end web platform engineered to modernize facility management, damage reporting, and repair tracking in educational institutions. 

Students and staff can quickly capture and submit facility issues (e.g., broken projectors, damaged furniture, electrical faults) with attached photographic evidence. Dedicated maintenance staff can track, filter, manage, and resolve tickets, while administrators supervise workflows, grant user privileges, and approve repair requests.

---

## ✨ Key Features

### 1. Student & Reporter Portal
- **Intuitive Reporting Flow**: Dynamic dropdowns populated from the database for room locations, facility categories, damaged items (with custom specify option), damage types, and urgency levels.
- **Media Upload**: Direct image uploads to Cloudinary with real-time thumbnail previews and file validations (JPEG, PNG, WebP up to 5MB).
- **Personal Report History (`/history`)**: Paginated tracking table showing ticket progression (`pending` 🟡, `in_progress` 🔵, `resolved` 🟢, `rejected` 🔴), along with official staff replies and repair completion photos.

### 2. Staff Maintenance Dashboard (`/dashboard`)
- **Centralized Work Queue**: View all incoming facility reports with quick-status filters (Pending, In Progress, Resolved, Rejected, or All Unresolved) and keyword search.
- **KPI Metrics**: Real-time statistical counters for total, pending, in-progress, resolved, and rejected reports.
- **Workflow Governance**:
  - High and Critical urgency reports can be acted upon immediately.
  - Low and Medium urgency reports require Admin authorization before transitioning to `in_progress` or `resolved`.
- **Ticket Actions**: Send photo approval requests to Admin, update repair status, write official replies to reporters, and attach completion proof images.

### 3. Administrator & Governance Panel (`/admin/approval`)
- **Photo & Request Approvals**: Centralized queue to approve or decline staff maintenance and verification requests, complete with visual breakdown charts.
- **User Permissions & RBAC Management**:
  - Live query integration with Clerk Backend API.
  - Paginated user list with email/name search.
  - Dynamic role promotion and demotion (`reporter`, `staff`, `admin`) with synchronized metadata updates and instant cache invalidation.

### 4. Security & Performance
- **Modern Authentication**: Powered by Clerk with session JWT verification, SSO/OAuth integration, and secure cookie handling.
- **Smart Caching**: In-memory caching for Clerk user profiles (5 min TTL) and dropdown options (10 min TTL) to maximize throughput and minimize API latency.
- **Multi-tiered Rate Limiting**:
  - Global limiter: 5,000 requests per 15 minutes.
  - Upload limiter: 100 uploads per hour per user.
  - Report submission limiter: 100 reports per hour per user.
- **SQL Injection Prevention**: Parameterized queries across all database interactions using `pg` connection pooling.

---

## 👥 Role-Based Access Control (RBAC)

| Feature / Action | Reporter (`reporter`) | Staff (`staff`) | Admin (`admin`) |
| :--- | :---: | :---: | :---: |
| Submit New Facility Report | ✅ | ✅ | 🔄 *(Redirects to Admin)* |
| View Own Report History | ✅ | ✅ | 🔄 *(Redirects to Admin)* |
| View Maintenance Dashboard | ❌ | ✅ | ❌ |
| Update Report Status & Reply | ❌ | ✅ | ❌ |
| Request Admin Photo Approval | ❌ | ✅ | ❌ |
| Approve / Decline Requests | ❌ | ❌ | ✅ |
| Manage User Roles & Permissions | ❌ | ❌ | ✅ |

---

## 🛠️ Tech Stack

- **Runtime & Framework**: [Node.js](https://nodejs.org/) (v18+) & [Express.js](https://expressjs.com/)
- **Authentication**: [@clerk/express](https://clerk.com/docs)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [`pg`](https://node-postgres.com/) connection pooling
- **Cloud Media Storage**: [Cloudinary](https://cloudinary.com/) & [`multer-storage-cloudinary`](https://github.com/affanshahid/multer-storage-cloudinary)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/) & [EJS Templating](https://ejs.co/)
- **Security & Utilities**: `express-rate-limit`, `cookie-parser`, `dotenv`, `morgan`
- **Containerization**: [Docker](https://www.docker.com/) (Node 22 Alpine)

---

## 📂 Project Architecture & Directory Structure

```text
MokletCare/
├── Dockerfile                  # Production container definition
├── app.js                      # Application entrypoint & middleware setup
├── db.js                       # PostgreSQL connection pool configuration
├── package.json                # Project dependencies and npm scripts
├── .env.example                # Template for environment configuration
│
├── middleware/
│   └── auth.js                 # Clerk authentication & RBAC guards with memory cache
│
├── migrations/                 # Version-controlled SQL schema migrations
│   ├── 001_create_reports_table.sql
│   ├── 002_add_verification_fields_to_reports.sql
│   ├── 003_add_detailed_damage_fields.sql
│   ├── 004_create_dropdown_options.sql
│   ├── 005_insert_damage_causes.sql
│   ├── 006_add_more_dropdown_options.sql
│   ├── 007_add_item_dropdown.sql
│   ├── 008_add_more_items.sql
│   ├── 009_add_even_more_items.sql
│   ├── 010_create_users_table.sql
│   ├── 011_add_indexes.sql
│   ├── 012_create_photo_requests_table.sql
│   ├── 013_add_finished_photo_and_reply_to_reports.sql
│   └── 014_drop_users_table.sql
│
├── public/                     # Static assets (CSS, JS, images, icons)
│   ├── javascripts/
│   └── stylesheets/
│       ├── input.css           # Tailwind CSS input styles
│       └── style.css           # Compiled Tailwind CSS
│
├── routes/
│   ├── index.js                # Core routes: reporting, history, staff dashboard, uploads
│   └── approval.js             # Admin routes: approvals, role management, photo requests
│
├── scripts/
│   └── migrate.js              # Automated database migration runner
│
└── views/                      # Server-rendered EJS templates
    ├── index.ejs               # Reporter form page
    ├── history.ejs             # User report history & status tracker
    ├── dashboard.ejs           # Staff maintenance dashboard
    ├── approval.ejs            # Admin approval & permissions center
    ├── login.ejs               # Clerk login & authentication view
    ├── logout.ejs              # Logout session cleanup view
    ├── sso-callback.ejs        # Clerk SSO OAuth callback handler
    ├── privacy-policy.ejs      # Privacy policy
    ├── tos.ejs                 # Terms of service
    └── error.ejs               # Global error template
```

---

## 🗄️ Database Schema & Migrations

MokletCare features an incremental SQL migration system tracked via the `migrations_history` table:

- **`reports`**: Stores incident tickets including room location, facility category, item, damage type, urgency (`pending`, `in_progress`, `resolved`, `rejected`), reporter contact details, uploaded image URLs, administrative replies, and completion photos.
- **`photo_requests`**: Tracks approval requests initiated by staff members sent to administrators for low/medium urgency or specific photo authorizations.
- **`dropdown_options`**: Dynamic options for facilities, items, damage classifications, and urgency rankings displayed in the reporting UI.
- **`migrations_history`**: Tracks executed migration files to prevent re-execution.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **PostgreSQL**: v14.0 or higher (Local instance or Cloud provider like Neon / Supabase)
- **Clerk Account**: Free tier at [clerk.com](https://clerk.com/)
- **Cloudinary Account**: Free tier at [cloudinary.com](https://cloudinary.com/)

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone git@github-school:Ahnaf-icprpl/MokletCare.git
   cd MokletCare
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```

---

### Environment Variables

Populate `.env` with your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (PostgreSQL URL)
DATABASE_URL=postgres://username:password@localhost:5432/mokletcare

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Admin Emails (Comma-separated bootstrap emails assigned admin privileges automatically)
ADMIN_EMAILS=admin@mokletcare.sch.id,principal@mokletcare.sch.id
ADMIN_EMAIL=admin@mokletcare.sch.id

# Cloudinary Storage
CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
```

---

### Running Database Migrations

Apply all schema migrations to your PostgreSQL database:

```bash
npm run migrate
```

*Output:*
```text
Connected to PostgreSQL.
Running migration: 001_create_reports_table.sql...
...
Successfully completed migration: 014_drop_users_table.sql
Successfully run 14 migration(s).
```

---

### Starting the Application

#### Development Mode (with hot-reloading & Tailwind watch):
```bash
npm run dev
```

#### Production Mode:
```bash
npm run build:css
npm start
```

Open your browser and visit: **`http://localhost:5000`**

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs Tailwind CSS compiler in watch mode and starts Express server with `nodemon`. |
| `npm run build:css` | Compiles `./public/stylesheets/input.css` into production-ready `./public/stylesheets/style.css`. |
| `npm run migrate` | Executes pending SQL migration scripts against the configured PostgreSQL database. |
| `npm start` | Starts the production Express server on the specified `PORT` (default `5000`). |

---

## 🛣️ Route & Endpoint Reference

### Public / Authentication Routes
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/login` | User authentication sign-in page |
| `GET` | `/logout` | User sign-out page and session termination |
| `GET` | `/sso-callback` | Clerk OAuth / SSO callback handler |
| `GET` | `/privacy-policy` | Privacy Policy page |
| `GET` | `/tos` | Terms of Service page |

### Reporter / Student Routes
| Method | Route | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | `reporter`, `staff` | Main facility incident reporting form |
| `POST` | `/report` | `reporter`, `staff` | Submit new facility damage report |
| `GET` | `/history` | `reporter`, `staff` | View user's submitted report history & statuses |
| `POST` | `/upload-image` | Authenticated | Upload image to Cloudinary (returns secure URL) |

### Staff Maintenance Routes
| Method | Route | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard` | `staff` | Staff maintenance dashboard & report queue |
| `POST` | `/dashboard/reports/:id/status` | `staff` | Update status, attach completion photo, or reply |
| `POST` | `/dashboard/reports/:id/reply` | `staff` | Send official reply to report submitter |
| `POST` | `/api/photo-request` | `staff` | Request approval/verification for a report |

### Administrator Routes
| Method | Route | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/approval` | `admin` | Admin center: photo approvals & user management |
| `POST` | `/admin/approval/:id/approve` | `admin` | Approve maintenance photo request |
| `POST` | `/admin/approval/:id/reject` | `admin` | Decline maintenance photo request |
| `POST` | `/admin/users/:id/role` | `admin` | Update user RBAC role in Clerk metadata |

---

## 🐳 Docker Deployment

You can containerize and deploy MokletCare using Docker:

### 1. Build the Docker Image
```bash
docker build -t mokletcare:latest .
```

### 2. Run the Container
```bash
docker run -d \
  --name mokletcare \
  -p 5000:5000 \
  --env-file .env \
  mokletcare:latest
```

---

## 👥 Development Team

| Name | Role | GitHub |
| :--- | :--- | :--- |
| **Dilshad Ahnaf** | Backend Developer | [@Ahnaf-icprpl](https://github.com/Ahnaf-icprpl) |
| **Rafale Alfardean Herawan** | Frontend Developer | [@RafaleAlfardean](https://github.com/RafaleAlfardean) |
| **Baruna Aryatama** | UI/UX Designer | [@BarunaAryatama](https://github.com/BarunaAryatama) |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is private and maintained for school educational and administrative purposes at **SMK Telkom Malang**.

<div align="center">
  <sub>Built with ❤️ for SMK Telkom Malang</sub>
</div>
