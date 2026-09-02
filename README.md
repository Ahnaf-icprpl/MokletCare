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

**Submission for ITECHNO CUP 2026 — Web Development Competition**

<br/>

<img src="docs/screenshots/dashboard-desktop.png" alt="MokletCare Hero Preview" width="880" />

</div>

---

## 📋 Table of Contents

- [👥 Development Team](#-development-team)
- [📖 Application Overview](#-application-overview)
  - [Background](#background)
  - [Proposed Solution](#proposed-solution)
  - [Project Objectives & Value Proposition](#project-objectives--value-proposition)
- [✨ Main Features & Key Advantages](#-main-features--key-advantages)
  - [Core Features Matrix](#core-features-matrix)
  - [Additional Capabilities](#additional-capabilities)
- [📸 Application Preview & Screenshots](#-application-preview--screenshots)
- [🛠️ Technology Used](#️-technology-used)
  - [Tech Stack Overview](#tech-stack-overview)
  - [Technology Rationale](#technology-rationale)
  - [Core Dependencies](#core-dependencies)
- [🏗️ System Architecture & Database Schema](#️-system-architecture--database-schema)
  - [System Workflow Architecture](#system-workflow-architecture)
  - [Database Schema & Data Model](#database-schema--data-model)
  - [Directory Structure](#directory-structure)
- [⚙️ Installation Guide](#️-installation-guide)
  - [Prerequisites](#prerequisites)
  - [Step-by-Step Installation](#step-by-step-installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Migrations](#database-migrations)
- [🚀 How to Use & Commands](#-how-to-use--commands)
  - [CLI Commands](#cli-commands)
  - [User & Role Workflow Guide](#user--role-workflow-guide)
- [🛣️ API & Route Reference](#️-api--route-reference)
- [🐳 Docker Deployment](#-docker-deployment)
- [📄 License & Acknowledgments](#-license--acknowledgments)

---

## 👥 Development Team

| Name | Role | GitHub Profile |
| :--- | :--- | :--- |
| **Dilshad Ahnaf** | Backend Developer & System Architect | [@Ahnaf-icprpl](https://github.com/Ahnaf-icprpl) |
| **Rafale Alfardean Herawan** | Frontend Developer | [@RaffFidela](https://github.com/RaffFidela) |
| **Baruna Aryatama** | UI/UX Designer | — |

---

## 📖 Application Overview

### Background
Educational institutions—particularly technology-focused vocational schools like **SMK Telkom Malang**—rely heavily on hundreds of high-utilization hardware assets, computer labs, air conditioning units, network equipment, and classroom infrastructure. In traditional setups:
1. **Reporting Bottlenecks**: Students and teachers report damages through unstructured WhatsApp messages, word of mouth, or physical paper forms, leading to lost tickets and forgotten repairs.
2. **Lack of Transparency**: Reporters have zero visibility into whether their tickets were received, assigned, or fixed.
3. **Budget & Authorization Confusion**: Technicians often lack clear guidelines on whether a minor vs. major repair requires administrative approval before procurement.

### Proposed Solution
**MokletCare** resolves these challenges by providing a unified, centralized, and transparent school facility incident management platform. With role-based workflows for **Reporters (Students/Teachers)**, **Maintenance Staff (Technicians)**, and **Administrators (Sarpras/Management)**, the system digitizes the entire lifecycle of facility repairs with photographic evidence, real-time status notifications, and governance controls.

### Project Objectives & Value Proposition
- 🎯 **Primary Objective**: Streamline and accelerate school facility maintenance from incident reporting to verified physical resolution with zero lost reports and complete auditability.
- 📊 **Target Users**:
  - **Students & Teachers (Reporters)**: Fast reporting with photo capture, categorized damaged items, and live status progress tracking.
  - **Maintenance Staff (Technicians)**: Priority-based work queue with quick filtering, urgent issue fast-tracking, admin verification requests, and completion photo uploads.
  - **School Administrators (Sarpras / Management)**: Strategic oversight, approval authorization for maintenance requests, and dynamic user permission delegation.
- 💡 **Value Proposition**: Unlike generic ticketing tools or messy chat groups, MokletCare is purpose-built for school infrastructure with built-in urgency classification, dual-tier administrative approval gates, Cloudinary-powered visual audits, and secure SSO authentication via Clerk.

---

## ✨ Main Features & Key Advantages

### Core Features Matrix

| Feature | Description | Key Advantage & Uniqueness |
| :--- | :--- | :--- |
| **Dynamic Incident Reporting** | Interactive reporting form with database-backed cascading dropdowns for rooms, facilities, items (with custom "other" specify option), damage types, and urgency levels. | Prevents vague reports; captures precise asset metadata and exact physical room locations. |
| **Visual Media Evidence** | Seamless image upload to Cloudinary with automatic format validation, 5MB limit, and real-time frontend image preview. | Provides indisputable photo evidence of damage before work begins and photographic proof of completion. |
| **Live Status Tracker (`/history`)** | Submitters view a paginated history of all personal reports with real-time status badges (`pending`, `in_progress`, `resolved`, `rejected`), staff notes, and completion photos. | Eliminates repetitive inquiries and ensures 100% transparency between students and maintenance teams. |
| **Staff Triage & Operations Dashboard (`/dashboard`)** | Centralized maintenance queue featuring real-time KPI metric counters, status filters, and multi-field keyword search across rooms, reporters, and descriptions. | Technicians can sort, prioritize, and manage hundreds of maintenance requests simultaneously. |
| **Two-Tier Approval Governance** | High/Critical urgency reports are fast-tracked immediately; Low/Medium urgency tickets require administrative approval before technicians can start work. | Prevents unauthorized procurement or non-budgeted maintenance while ensuring life-safety issues are resolved immediately. |
| **Admin Approvals & RBAC Delegation (`/admin/approval`)** | Administrative command center to review staff photo requests with interactive statistical breakdowns, and assign user roles (`reporter`, `staff`, `admin`) via Clerk. | Granular control over permissions without needing direct database access or manual SQL queries. |

### Additional Capabilities
- 🛡️ **Multi-Tier Rate Limiting**: Global DDoS protection (5000 req/15min) paired with dedicated per-user upload (100/hr) and report creation (100/hr) throttling.
- ⚡ **High-Performance Memory Caching**: 5-minute TTL caching for Clerk user profiles and 10-minute TTL caching for dropdown taxonomies to reduce database and API overhead.
- 🔒 **SQL Injection Immunity**: 100% parameterized SQL queries via PostgreSQL client connection pool.
- 📱 **Mobile-First Responsive Layout**: Built with Tailwind CSS v4, perfectly optimized for both desktop monitors and student mobile devices.

---

## 📸 Application Preview & Screenshots

### 🛠️ 1. Staff Maintenance Dashboard & Inspection Modal
Centralized operations center for maintenance staff to inspect facility issues, track KPI statistics, filter reports, and update statuses with completion notes.

| Desktop Dashboard View | Report Inspection & Action Modal | Mobile Dashboard View |
| :---: | :---: | :---: |
| <img src="docs/screenshots/dashboard-desktop.png" width="100%" alt="Dashboard Desktop" /> | <img src="docs/screenshots/report-details-modal.png" width="100%" alt="Report Details Modal" /> | <img src="docs/screenshots/dashboard-mobile.png" width="100%" alt="Dashboard Mobile" /> |
| *Queue management with real-time KPI metrics* | *Photo proof inspection & status update* | *Responsive on-the-go maintenance view* |

<br/>

### 📝 2. Student & Reporter Incident Reporting Form
Clean and accessible interface for students, teachers, and school staff to report damaged items with photo uploads.

| Desktop Reporting Interface | Mobile Reporting Interface |
| :---: | :---: |
| <img src="docs/screenshots/report-form-desktop.png" width="100%" alt="Reporter Desktop" /> | <img src="docs/screenshots/report-form-mobile.png" width="55%" alt="Reporter Mobile" /> |
| *Full incident form with location & dynamic item selectors* | *Mobile-first responsive submission form* |

<br/>

### 🔐 3. Authentication & Security Flow (Powered by Clerk)
Seamless and secure authentication flow with OAuth SSO, email password login, and 6-digit OTP email verification.

| Sign In Portal | Account Registration | Email OTP Verification |
| :---: | :---: | :---: |
| <img src="docs/screenshots/auth-signin.png" width="100%" alt="Clerk Sign-In" /> | <img src="docs/screenshots/auth-signup.png" width="100%" alt="Clerk Sign-Up" /> | <img src="docs/screenshots/auth-email-verification.png" width="100%" alt="Clerk OTP Verification" /> |
| *Single Sign-On (Google/Apple) & email login* | *User registration with client validation* | *Secure 6-digit email verification code* |

---

## 🛠️ Technology Used

### Tech Stack Overview

#### Frontend
```text
Rendering Engine : EJS (Embedded JavaScript Templates)
Styling Engine   : Tailwind CSS v4 (@tailwindcss/cli)
Icons & Assets   : Heroicons / Custom SVG UI Components
Client Scripting : Vanilla JavaScript (Fetch API, DOM manipulation)
```

#### Backend
```text
Runtime          : Node.js (v18+ LTS / v20 / v22)
Web Framework    : Express.js 4.22
Database Driver  : node-postgres (pg v8.22 connection pool)
Authentication   : Clerk Express SDK (@clerk/express) & JWT session claims
File Processing  : Multer & multer-storage-cloudinary
Security Layers  : express-rate-limit, cookie-parser, trust-proxy handling
```

#### Storage & Infrastructure
```text
Relational DB    : PostgreSQL 14+ (Local, Neon Serverless, or Supabase)
Media Storage    : Cloudinary Cloud CDN
Containerization : Docker (Alpine Linux Node 22)
```

---

### Technology Rationale

| Technology | Why It Was Chosen |
| :--- | :--- |
| **Node.js & Express.js** | Lightweight, event-driven I/O model capable of handling high concurrent traffic with minimal resource consumption. |
| **PostgreSQL & `pg`** | Robust ACID compliance, native relational constraints, ENUM data types, and transactional migration reliability. |
| **Tailwind CSS v4** | Next-generation ultra-fast CSS compiler producing minimal bundle sizes with a modern, maintainable design system. |
| **Clerk Authentication** | Enterprise-grade identity provider supporting Google/Apple SSO, email OTP verification, session management, and RBAC metadata. |
| **Cloudinary** | Automatic image optimization, CDN asset delivery, responsive image transformations, and secure media hosting. |
| **EJS (Server-Side Rendering)** | Eliminates client-side hydration delays, provides fast First Contentful Paint (FCP), and guarantees secure authentication redirects. |

---

### Core Dependencies

```json
{
  "dependencies": {
    "@clerk/express": "^2.1.54",
    "cloudinary": "^1.41.3",
    "cookie-parser": "~1.4.4",
    "dotenv": "^17.4.2",
    "ejs": "^6.0.1",
    "express": "^4.22.2",
    "express-rate-limit": "^8.6.0",
    "http-errors": "~1.6.3",
    "jsonwebtoken": "^9.0.3",
    "morgan": "~1.9.1",
    "multer": "^2.2.0",
    "multer-storage-cloudinary": "^4.0.0",
    "pg": "^8.22.0"
  },
  "devDependencies": {
    "@tailwindcss/cli": "^4.3.3",
    "concurrently": "^10.0.4",
    "nodemon": "^3.1.14",
    "tailwindcss": "^4.3.3"
  }
}
```

---

## 🏗️ System Architecture & Database Schema

### System Workflow Architecture

```mermaid
flowchart TD
    subgraph Client["Client Tier (Web & Mobile Browser)"]
        Reporter["👨‍🎓 Student / Reporter"]
        Staff["👨‍🔧 Maintenance Staff"]
        Admin["👨‍💼 School Administrator"]
    end

    subgraph AuthTier["Authentication & Edge Tier"]
        ClerkAuth["🔐 Clerk Authentication (SSO / OTP / JWT)"]
        RateLimiter["🛡️ Express Rate Limiter (Global / Upload / Report)"]
    end

    subgraph AppTier["Application Server (Express.js)"]
        RouterIndex["App Router & Middleware"]
        AuthMiddleware["RBAC Guard & In-Memory Cache"]
        UploadHandler["Multer Cloudinary Handler"]
    end

    subgraph StorageTier["Data & Media Layer"]
        PostgresDB[("🐘 PostgreSQL Database")]
        CloudinaryCDN["☁️ Cloudinary Media CDN"]
    end

    Reporter -->|Submit Report & Photo| ClerkAuth
    Staff -->|Triage & Resolve Reports| ClerkAuth
    Admin -->|Approve Requests & Manage Roles| ClerkAuth

    ClerkAuth --> RateLimiter
    RateLimiter --> AuthMiddleware
    AuthMiddleware --> RouterIndex

    RouterIndex -->|Upload Evidence| UploadHandler
    UploadHandler -->|Store Image| CloudinaryCDN

    RouterIndex -->|CRUD Reports & Migrations| PostgresDB
    RouterIndex -->|Manage Photo Requests| PostgresDB
```

---

### Database Schema & Data Model

```mermaid
erDiagram
    reports {
        int id PK
        varchar reporter_name
        varchar reporter_email
        varchar room_location
        varchar facility_type
        varchar item_type
        varchar damage_type
        varchar urgency_level
        text damage_description
        varchar photo_path
        varchar finished_photo_path
        text admin_reply
        report_status status
        timestamp resolved_at
        timestamp created_at
        timestamp updated_at
    }

    photo_requests {
        int id PK
        int report_id FK
        varchar staff_id
        varchar staff_email
        varchar staff_name
        varchar recipient_type
        varchar recipient_email
        varchar photo_url
        text photo_description
        varchar status
        text request_message
        timestamp created_at
        timestamp updated_at
    }

    dropdown_options {
        int id PK
        varchar category
        varchar value
        varchar label
        int sort_order
    }

    migrations_history {
        int id PK
        varchar filename UK
        timestamp run_at
    }

    reports ||--o{ photo_requests : "triggers approval"
```

---

### Directory Structure

```text
MokletCare/
├── Dockerfile                  # Production container configuration
├── app.js                      # Express app initialization, rate limiting, and middleware
├── db.js                       # PostgreSQL connection pooling with pg
├── package.json                # NPM packages and lifecycle scripts
├── .env.example                # Sample environment variables file
│
├── middleware/
│   └── auth.js                 # Clerk session validation, RBAC checks, and user memory cache
│
├── migrations/                 # Transactional SQL migration scripts (001 - 014)
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
├── public/                     # Static files (Compiled CSS, client JS, favicons)
│   ├── javascripts/
│   └── stylesheets/
│       ├── input.css           # Tailwind CSS v4 source styles
│       └── style.css           # Compiled output CSS
│
├── routes/
│   ├── index.js                # Public, Reporter, and Staff dashboard routes
│   └── approval.js             # Admin approval queue and RBAC user permissions routes
│
├── scripts/
│   └── migrate.js              # Database migration runner with automatic rollback
│
├── docs/                       # Screenshots and visual documentation
│   └── screenshots/
│
└── views/                      # EJS server-rendered templates
    ├── index.ejs               # Incident reporting form
    ├── history.ejs             # Reporter personal tracking table
    ├── dashboard.ejs           # Staff maintenance operations center
    ├── approval.ejs            # Admin approvals and permissions manager
    ├── login.ejs               # Clerk authentication sign-in
    ├── logout.ejs              # Session termination view
    ├── sso-callback.ejs        # SSO OAuth redirect handler
    ├── privacy-policy.ejs      # Privacy Policy document
    ├── tos.ejs                 # Terms of Service document
    └── error.ejs               # Error handler page
```

---

## ⚙️ Installation Guide

### Prerequisites
Before running the application, make sure you have the following installed and configured:
- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **PostgreSQL**: `v14.0` or higher (Local database or Cloud like Neon / Supabase)
- **Clerk Account**: For authentication API keys ([Clerk.com](https://clerk.com/))
- **Cloudinary Account**: For media storage URL ([Cloudinary.com](https://cloudinary.com/))
- **Git**: For version control

---

### Step-by-Step Installation

#### 1️⃣ Clone the Repository
```bash
git clone git@github-school:Ahnaf-icprpl/MokletCare.git
cd MokletCare
```

#### 2️⃣ Install Dependencies
```bash
npm install
```

#### 3️⃣ Setup Environment Variables
Create a `.env` file in the project root by copying the template:
```bash
cp .env.example .env
```

---

### Environment Configuration

Configure `.env` with your actual credentials:

```env
# Application Server
PORT=5000
NODE_ENV=development

# PostgreSQL Database Connection
DATABASE_URL=postgres://username:password@localhost:5432/mokletcare

# Clerk Authentication Keys (from Clerk Dashboard > API Keys)
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Administrator Bootstrap Emails (comma-separated)
ADMIN_EMAILS=admin@mokletcare.sch.id,principal@mokletcare.sch.id
ADMIN_EMAIL=admin@mokletcare.sch.id

# Cloudinary Storage Configuration
CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
```

---

### Database Migrations

Run all database schema migrations to set up required tables, enum types, and index optimizations:

```bash
npm run migrate
```

*Expected output:*
```text
Connected to PostgreSQL.
Running migration: 001_create_reports_table.sql...
...
Successfully completed migration: 014_drop_users_table.sql
Successfully run 14 migration(s).
```

---

## 🚀 How to Use & Commands

### CLI Commands

| Command | Action | Environment |
| :--- | :--- | :--- |
| `npm run dev` | Runs Tailwind CSS compiler in watch mode alongside `nodemon` for hot-reloading. | Development |
| `npm run build:css` | Compiles `./public/stylesheets/input.css` into minified `./public/stylesheets/style.css`. | Production / Build |
| `npm run migrate` | Executes all pending SQL migration files with transactional rollback safety. | Setup / CI/CD |
| `npm start` | Starts the production Express server on configured `PORT` (default: 5000). | Production |

---

### User & Role Workflow Guide

#### 1. For Students & Teachers (Reporters)
1. **Access & Sign In**: Navigate to `http://localhost:5000/login` and authenticate using Google SSO or Email.
2. **Submit Report (`/`)**: 
   - Fill in Room Location (e.g. `Lab RPL 1`).
   - Select Facility Type, Damaged Item, Damage Type, and Urgency Level.
   - Describe the issue and upload a photo evidence.
   - Click **Submit Report**.
3. **Track Status (`/history`)**:
   - Access **My Reports** from the navigation bar.
   - Monitor real-time status badges, technician responses, and completion photos.

#### 2. For Maintenance Staff (Technicians)
1. **Open Dashboard (`/dashboard`)**: Log in with an account assigned the `staff` role.
2. **Filter & Search**: Use status filter tabs (*Pending, In Progress, Resolved, Rejected*) or search keywords.
3. **Inspect Ticket**: Click any report card to open the inspection modal.
4. **Approval Request**: For Low/Medium urgency reports, send a photo verification request to the Admin.
5. **Update Progress & Resolution**: Change status to `in_progress` or `resolved`, attach completion photos, and leave notes for the reporter.

#### 3. For School Administrators (Admin)
1. **Open Admin Center (`/admin/approval`)**: Log in with an email listed in `ADMIN_EMAILS` or granted `admin` role.
2. **Review Requests**: Approve or reject photo verification requests sent by technicians.
3. **User Management**: Search through users and toggle permissions (`reporter`, `staff`, `admin`) in real time.

---

## 🛣️ API & Route Reference

### Authentication & Public Endpoints
| HTTP Method | Route | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/login` | Public | Clerk authentication sign-in and registration page |
| `GET` | `/logout` | Public | User sign-out and session destruction |
| `GET` | `/sso-callback` | Public | OAuth SSO callback redirect handler |
| `GET` | `/privacy-policy` | Public | Privacy Policy compliance documentation |
| `GET` | `/tos` | Public | Terms of Service documentation |

### Reporter Endpoints
| HTTP Method | Route | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | `reporter`, `staff` | Facility incident reporting form page |
| `POST` | `/report` | `reporter`, `staff` | Create and store a new facility damage report |
| `GET` | `/history` | `reporter`, `staff` | Paginated personal report tracking history |
| `POST` | `/upload-image` | Authenticated | Upload photo evidence to Cloudinary CDN |

### Staff Maintenance Endpoints
| HTTP Method | Route | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard` | `staff` | Maintenance dashboard with KPI cards and triage queue |
| `POST` | `/dashboard/reports/:id/status` | `staff` | Update ticket status, resolution photo, or admin reply |
| `POST` | `/dashboard/reports/:id/reply` | `staff` | Submit official response to report submitter |
| `POST` | `/api/photo-request` | `staff` | Request approval/verification for a report |

### Administrator Endpoints
| HTTP Method | Route | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/approval` | `admin` | Admin dashboard for photo approvals and user RBAC |
| `POST` | `/admin/approval/:id/approve` | `admin` | Approve maintenance photo request |
| `POST` | `/admin/approval/:id/reject` | `admin` | Decline maintenance photo request |
| `POST` | `/admin/users/:id/role` | `admin` | Update user permission role in Clerk metadata |

---

## 🐳 Docker Deployment

MokletCare includes a lightweight Alpine-based container configuration for frictionless deployment:

### 1. Build Docker Image
```bash
docker build -t mokletcare:latest .
```

### 2. Run Container
```bash
docker run -d \
  --name mokletcare-app \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  mokletcare:latest
```

---

## 📄 License & Acknowledgments

This project is developed and maintained for **SMK Telkom Malang** as a submission for **ITECHNO CUP 2026 — Web Development Competition**.

<br/>

<div align="center">
  <sub>Made with ❤️ by <b>Dilshad Ahnaf, Rafale Alfardean Herawan, and Baruna Aryatama</b> for <b>ITECHNO CUP 2026</b></sub>
</div>
