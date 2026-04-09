<div align="center">

# ⚡ SwiftyPOS

**A modern, full-featured Point of Sale system built for speed, clarity, and scale.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![MUI](https://img.shields.io/badge/MUI-7-007FFF?style=flat-square&logo=mui)](https://mui.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## 📖 Overview

SwiftyPOS is an enterprise-grade Point of Sale application designed for cafes, restaurants, and retail businesses. It combines a blazing-fast POS terminal interface with a powerful admin dashboard — all backed by Supabase for real-time data and authentication.

Built on a **SaaS-ready architecture**, SwiftyPOS supports multiple subscription tiers, role-based access control, a Kitchen Display System (KDS), and deep reporting & accounting features — making it suitable from solo operators to multi-location businesses.

---

## ✨ Features

### 🛒 POS Terminal
- Fast, touch-friendly order interface
- Product search & category filtering
- Cart management with quantity controls
- Hold & recall orders
- Discount and tax calculation
- Receipt printing (PDF & thermal)
- Barcode support

### 🍳 Kitchen Display System (KDS)
- Real-time order queue for kitchen staff
- Order status tracking (pending → preparing → ready)
- Audible alerts for new orders

### 🗂️ Admin Dashboard
| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time KPIs, revenue charts, and sales summaries |
| **Sales** | Full transaction history with search, filter & export |
| **Inventory** | Product & ingredient management with SKU tracking |
| **Categories** | Manage product categories with icons |
| **Reports** | Revenue trends, top-selling items, visual analytics |
| **Accounting** | Income/expense ledger and financial summaries |
| **Settings** | Store configuration, tax rates, receipt customization |
| **Roles & Permissions** | Fine-grained RBAC for Admin, Manager, Cashier roles |
| **Activity Log** | Full audit trail of all user actions |
| **SaaS Dashboard** | Subscription management and multi-tenant overview |

### 🔐 Authentication & RBAC
- Supabase Auth (email/password)
- Role-based route protection (`admin`, `manager`, `cashier`)
- Protected routes with automatic redirects
- Row Level Security (RLS) enforced on all database tables

### 📦 SaaS Subscription System
- Tiered subscription plans (Free, Pro, Enterprise)
- Premium feature gating with upgrade prompts
- Subscription store powered by Zustand

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 8 |
| **UI Library** | MUI (Material UI) v7 |
| **Icons** | Lucide React + MUI Icons |
| **Styling** | Emotion + Tailwind CSS v4 |
| **Animations** | Framer Motion |
| **State Management** | Zustand v5 |
| **Routing** | React Router DOM v7 |
| **Backend / Auth** | Supabase (PostgreSQL + Auth + Storage) |
| **Charts** | Recharts + MUI X Charts |
| **Data Grid** | MUI X Data Grid |
| **Date Utilities** | date-fns |
| **PDF Export** | jsPDF + html2canvas |
| **Excel Export** | SheetJS (xlsx) |
| **Barcode** | react-barcode |
| **PWA** | vite-plugin-pwa |
| **Testing** | Vitest + React Testing Library |
| **E2E Testing** | Playwright |

---

## 📁 Project Structure

```
SwiftyPOS/
├── public/                   # Static assets
├── src/
│   ├── assets/               # Images and media
│   ├── components/
│   │   ├── admin/            # Admin-specific components
│   │   ├── common/           # Shared UI components
│   │   ├── pos/              # POS terminal components
│   │   └── saas/             # SaaS/subscription components
│   ├── hooks/                # Custom React hooks
│   ├── layouts/
│   │   ├── AdminLayout.tsx   # Admin dashboard shell
│   │   └── POSLayout.tsx     # POS terminal shell
│   ├── lib/                  # Third-party client configs (Supabase, etc.)
│   ├── pages/
│   │   ├── admin/            # All admin dashboard pages
│   │   ├── auth/             # Login page
│   │   ├── pos/              # POS terminal & KDS pages
│   │   └── public/           # Public-facing landing page
│   ├── services/             # API service layer (Supabase queries)
│   ├── store/                # Zustand state stores
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions & formatters
├── supabase/                 # Supabase local config
├── supabase_schema.sql       # Full DB schema with RLS policies & seed data
├── e2e/                      # Playwright E2E tests
├── .env.example              # Environment variable template
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A [Supabase](https://supabase.com) project

### 1. Clone the repository

```bash
git clone https://github.com/dev-hmo/SwiftyPOS.git
cd SwiftyPOS
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Set up the database

1. Go to your [Supabase Dashboard](https://app.supabase.com) → **SQL Editor**
2. Paste the contents of `supabase_schema.sql` and run it
3. This creates all tables, enables Row Level Security, and seeds initial demo data

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Database Schema

The database is powered by **Supabase (PostgreSQL)** with the following core tables:

```
categories      → Product categories
products        → Product catalog with SKU, price, stock
customers       → Customer registry with loyalty points
sales           → Transaction records (receipts)
sale_items      → Line items linked to each sale
```

All tables have **Row Level Security (RLS)** enabled. Authenticated users (cashiers, managers, admins) get full CRUD access. Unauthenticated users are blocked at the database level.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint the codebase with ESLint |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run test:e2e` | Run E2E tests with Playwright |

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `admin` | Full access to all admin pages, settings, and RBAC |
| `manager` | Access to sales, inventory, and reports |
| `cashier` | Access to POS terminal only |

Roles are managed through Supabase Auth metadata and enforced via protected routes on the frontend.

---

## 🔑 Default Route Structure

| Route | Description |
|-------|-------------|
| `/` | Public landing page (SaaS marketing) |
| `/login` | Authentication page |
| `/admin` | Admin dashboard (protected) |
| `/admin/sales` | Sales history |
| `/admin/inventory` | Product & ingredient management |
| `/admin/reports` | Analytics & reports |
| `/admin/accounting` | Financial accounting |
| `/admin/settings` | Store settings |
| `/admin/settings/roles` | Role management |
| `/admin/activity` | Activity log |
| `/admin/saas` | SaaS management dashboard |
| `/pos` | POS terminal (protected) |
| `/kds` | Kitchen Display System (protected) |

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss major changes.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/dev-hmo">dev-hmo</a>
</div>
