# 📚 Library Management System

A full-stack web application for managing a library's book catalogue, member accounts, and borrowing records — fully containerised with Docker.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Default Credentials](#default-credentials)
- [Project Structure](#project-structure)
- [Docker Configuration](#docker-configuration)
- [Backend — Laravel API](#backend--laravel-api)
  - [Database Migrations](#database-migrations)
  - [Models](#models)
  - [Controllers](#controllers)
  - [Middleware](#middleware)
  - [API Routes](#api-routes)
  - [Database Seeder](#database-seeder)
- [Frontend — React Application](#frontend--react-application)
  - [App Entry Points](#app-entry-points)
  - [Auth Context](#auth-context)
  - [API Client](#api-client)
  - [Components](#components)
  - [Pages](#pages)
  - [Styling](#styling)
- [Feature Walkthroughs](#feature-walkthroughs)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [Useful Commands](#useful-commands)

---

## Project Overview

The Library Management System has two user roles:

| Role | Capabilities |
|------|-------------|
| **Member** | Browse books, search & filter, borrow up to 3 books, return books, view history, manage profile |
| **Admin** | Everything a member can do + add/edit/delete books, suspend/activate member accounts, view dashboard stats |

A **Google Dialogflow chatbot** is embedded as a floating widget on every page.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, React Router v6, Axios, React Toastify |
| Backend | Laravel 8, PHP 8.3, Laravel Sanctum (token auth) |
| Database | Microsoft SQL Server 2022 |
| Web Servers | Apache (Laravel) + Nginx (React) |
| Infrastructure | Docker + Docker Compose |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                     │
│   React SPA (localhost:5173)                            │
│   Axios HTTP ──────────────────────────────────────►   │
│               ◄──────────────────────────── JSON       │
└──────────────────────────┬──────────────────────────────┘
                           │  Docker Network: library_net
         ┌─────────────────┼──────────────────────┐
         ▼                 ▼                       ▼
  ┌─────────────┐  ┌───────────────┐  ┌──────────────────┐
  │   CLIENT    │  │    SERVER     │  │       DB         │
  │  Nginx:80   │  │  Apache:80    │  │  MSSQL:1433      │
  │  (→ :5173)  │  │  (→ :8000)    │  │  (→ :1433)       │
  │             │  │               │  │                  │
  │ Serves the  │  │  Laravel API  │  │  Stores all data │
  │ React SPA   │  │  (REST/JSON)  │  │                  │
  └─────────────┘  └───────┬───────┘  └──────────────────┘
                           └──── PDO_SQLSRV connection ────►
```

**Authentication flow:** On login, Laravel creates a Sanctum personal access token. React stores it in `localStorage` and sends it as `Authorization: Bearer <token>` on every subsequent request.

---

## Prerequisites

You only need **two tools** installed:

1. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (v24+, includes Docker Compose v2)
2. **[Git](https://git-scm.com/)**

PHP, Node.js, SQL Server — everything else runs inside Docker containers. No local installation required.

> **System requirements:** 6 GB free RAM, 8 GB free disk, 64-bit OS (Windows 10+, macOS 12+, Ubuntu 20.04+)

---

## Quick Start

```bash
# 1. Clone the repository
git clone <your-repository-url>
cd library-management

# 2. Build and start all containers
docker compose up --build
```

The first build takes **5–15 minutes** (downloads base images, compiles PHP extensions). Subsequent starts take ~30 seconds.

**Automatic on startup:**
- ✅ SQL Server initialises
- ✅ Database `library_management` created
- ✅ User `laravel_user` created with permissions
- ✅ All migrations run (tables created)
- ✅ Database seeded (admin, member, categories, 10 books)
- ✅ Apache starts

**Open the app:** http://localhost:5173

**Stop the project:**
```bash
docker compose down          # keeps database data
docker compose down -v       # also deletes all data (full reset)
```

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@library.com` | `Admin@1234` |
| Member | `member@library.com` | `Member@1234` |

**Database connection (for tools like DBeaver):**
```
Host: localhost   Port: 1433
Database: library_management
Username: laravel_user   Password: Laravel@123
```

---

## Project Structure

```
library-management/
├── docker-compose.yml              # Defines all 3 containers
├── docker/mssql/init.sql           # SQL run on DB first start
│
├── client/                         # React frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html                  # Loads Dialogflow script, mounts React
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx                # App entry point
│       ├── App.tsx                 # Root component, routes, chatbot
│       ├── api.ts                  # Axios instance + interceptors
│       ├── index.css               # All styles + responsive CSS
│       ├── context/
│       │   └── AuthContext.tsx     # Global auth state
│       ├── components/
│       │   ├── Navbar.tsx          # Top nav + hamburger menu
│       │   ├── AddBookModal.tsx    # Create book modal form
│       │   └── EditBookModal.tsx   # Edit book modal form
│       └── pages/
│           ├── Home.tsx            # Book catalogue
│           ├── Login.tsx
│           ├── Register.tsx
│           ├── BookDetail.tsx      # Single book + borrow button
│           ├── MyBooks.tsx         # Active borrows + history
│           ├── Profile.tsx         # Profile management
│           └── AdminPanel.tsx      # Admin dashboard
│
└── server/                         # Laravel backend
    ├── Dockerfile
    ├── docker-entrypoint.sh        # Startup: wait, migrate, seed, serve
    ├── .env                        # Auto-generated by entrypoint
    ├── routes/api.php              # All API routes
    ├── app/
    │   ├── Http/
    │   │   ├── Kernel.php
    │   │   ├── Controllers/
    │   │   │   ├── AuthController.php
    │   │   │   ├── BookController.php
    │   │   │   ├── RecordController.php
    │   │   │   ├── AdminController.php
    │   │   │   └── ProfileController.php
    │   │   └── Middleware/
    │   │       ├── HandleCors.php
    │   │       └── IsAdmin.php
    │   └── Models/
    │       ├── User.php
    │       ├── Book.php
    │       ├── Category.php
    │       └── Record.php
    └── database/
        ├── migrations/
        └── seeders/DatabaseSeeder.php
```

---

## Docker Configuration

### docker-compose.yml

Defines three services on a shared bridge network (`library_net`):

| Service | Image | Host Port | Purpose |
|---------|-------|-----------|---------|
| `db` | `mcr.microsoft.com/mssql/server:2022-latest` | 1433 | SQL Server database |
| `server` | Built from `./server/Dockerfile` | 8000 | Laravel REST API |
| `client` | Built from `./client/Dockerfile` | 5173 | React SPA |

**Startup order:** `db` must pass its healthcheck before `server` starts. `client` starts after `server`. The healthcheck runs `sqlcmd SELECT 1` every 15 seconds.

**Persistent storage:** A named volume `mssql_data` stores all database files. It survives `docker compose down` but is deleted with `docker compose down -v`.

---

### server/Dockerfile

```
php:8.3-apache
  → install system libs
  → install ODBC Driver 18 + sqlcmd (for MSSQL)
  → install PHP extensions: pdo, mbstring, gd, zip, sqlsrv, pdo_sqlsrv
  → enable Apache mod_rewrite + mod_headers
  → write explicit VirtualHost config (hardcoded paths, CORS headers at Apache level)
  → install Composer dependencies
  → set www-data ownership
```

> **Why CORS headers at Apache level?** If PHP throws an uncaught exception, Laravel middleware never runs — the browser gets a CORS error instead of the real error. Setting headers in Apache's VirtualHost guarantees they're always present.

---

### server/docker-entrypoint.sh

Runs every time the server container starts, before Apache:

1. **Fix storage permissions** — volume mounts overwrite Docker build-time `chown`
2. Write `.env` from Docker Compose environment variables
3. Generate `APP_KEY` if blank
4. Wait up to **5 minutes** for SQL Server (60 retries × 5s)
5. Create database + login + permissions (idempotent)
6. `php artisan migrate --force`
7. `php artisan db:seed --force`
8. Create storage symlink
9. Clear config/cache
10. `exec apache2-foreground`

---

### client/Dockerfile (Two-Stage Build)

```
Stage 1 (builder): node:20-alpine
  → npm install
  → Receive VITE_API_URL build arg (baked into compiled JS)
  → npm run build → /app/dist

Stage 2 (production): nginx:alpine
  → Copy only /app/dist (discards Node.js + source)
  → Copy nginx.conf
```

The final image is ~30 MB instead of ~600 MB.

---

### client/nginx.conf

The key directive is the **SPA fallback**:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
Without this, refreshing a URL like `/books/5` would return a 404 (Nginx looks for a real file). Instead it serves `index.html` and React Router handles the navigation in-browser.

---

## Backend — Laravel API

### Database Migrations

Run automatically on startup. Cannot be reordered (filenames are timestamps).

| File | Creates Table | Purpose |
|------|--------------|---------|
| `2019_12_14_000001...` | `personal_access_tokens` | Sanctum token storage |
| `2024_01_01_000001...` | `users` | User accounts |
| `2024_01_01_000003...` | `categories` | Book categories |
| `2024_01_01_000004...` | `books` | Book catalogue |
| `2024_01_01_000005...` | `records` | Borrowing records |

> **MSSQL compatibility notes applied during development:**
> - `->string(20)` instead of `->enum()` for `type` and `status` columns
> - `onDelete('no action')` instead of `onDelete('restrict')` (MSSQL doesn't support RESTRICT)
> - `->string(2000)` instead of `->text()` for `description` (avoids MSSQL text type issues)

---

### Models

#### User — `app/Models/User.php`

| Trait | What it adds |
|-------|-------------|
| `HasApiTokens` | `createToken()`, `tokens()` — Sanctum auth |
| `SoftDeletes` | `deleted_at` — deleted users stay in DB, invisible to queries |
| `Notifiable` | Email/notification support |

**Key methods:**
```php
records()       // HasMany → borrowing records
isAdmin()       // true if type === 'admin'
activeRecords() // records where returned_at IS NULL
```

#### Book — `app/Models/Book.php`

```php
category()     // BelongsTo Category
records()      // HasMany Record
activeRecord() // HasOne → current unreturned record (or null)
isAvailable()  // true if no active borrow record exists
```

#### Category — `app/Models/Category.php`

```php
books()        // HasMany Book
```

#### Record — `app/Models/Record.php`

All timestamp columns (`borrowed_at`, `due_date`, `returned_at`) are cast to Carbon datetime objects automatically.

```php
user()         // BelongsTo User
book()         // BelongsTo Book
isOverdue()    // true if returned_at IS NULL AND due_date is past
```

---

### Controllers

#### AuthController

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `register` | `POST /api/register` | Validates input, creates user, returns user object |
| `login` | `POST /api/login` | Checks credentials, creates Sanctum token, returns `{user, token}` |
| `logout` | `POST /api/logout` | Deletes current token from DB |
| `me` | `GET /api/user` | Returns authenticated user (used to verify token on app mount) |

Login checks three conditions before issuing a token:
1. Password hash matches
2. Account is not soft-deleted
3. Account status is not `suspended`

#### BookController

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `index` | `GET /api/books` | Paginated list with optional `search`, `category_id` filters |
| `show` | `GET /api/books/{id}` | Single book with category and current borrower |
| `store` | `POST /api/books` | Create book (Admin only), handles image upload |
| `update` | `POST/PUT /api/books/{id}` | Update book (Admin only), replaces image if provided |
| `destroy` | `DELETE /api/books/{id}` | Delete book (Admin only), refuses if currently borrowed |
| `categories` | `GET /api/categories` | All categories (public) |

> **ISBN validation uses array syntax** to avoid Laravel treating the `|` inside the regex as a rule separator:
> ```php
> ['required', 'string', 'unique:books,isbn_no', 'regex:/^(?:\d{10}|\d{13})$/']
> ```

#### RecordController

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `myBooks` | `GET /api/my-books` | Returns `{current: [...], history: [...]}` for the user |
| `borrow` | `POST /api/borrow/{book_id}` | Creates a record with `due_date = now + 14 days` |
| `return` | `POST /api/return/{record_id}` | Sets `returned_at = now` |

`borrow` enforces two hard limits:
- User has < 3 active borrows
- Book `isAvailable()` is true

`return` verifies the record belongs to the requesting user **and** is not already returned — prevents returning others' books or double-returning.

#### AdminController

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `stats` | `GET /api/admin/stats` | Returns 4 aggregate counts |
| `users` | `GET /api/admin/users` | Paginated member list including soft-deleted |
| `updateUserStatus` | `PUT /api/admin/users/{id}/status` | Sets status to active/suspended; refuses for admins |

#### ProfileController

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `show` | `GET /api/profile` | Returns current user |
| `update` | `PUT /api/profile` | Updates name/email |
| `changePassword` | `PUT /api/profile/password` | Verifies old password, sets new one |
| `destroy` | `DELETE /api/profile` | Revokes all tokens, soft-deletes user |

---

### Middleware

#### HandleCors — `app/Http/Middleware/HandleCors.php`

**Registered globally** in `Kernel.php` — runs on every single request.

- `OPTIONS` preflight requests → returns `204` immediately with all CORS headers
- All other requests → attaches CORS headers to the response before it goes back to the browser

Uses `FRONTEND_URL` env var as the allowed origin (`http://localhost:5173`).

#### IsAdmin — `app/Http/Middleware/IsAdmin.php`

**Registered as `is.admin`** in `Kernel.php`. Applied to the admin route group.

Checks `$request->user()->type === 'admin'`. Returns `403 Forbidden` if not.

---

### API Routes

```
routes/api.php — all paths prefixed with /api
```

```
PUBLIC (no auth needed):
  POST   /register
  POST   /login
  GET    /books
  GET    /books/{id}
  GET    /categories

AUTHENTICATED (Bearer token required):
  POST   /logout
  GET    /user
  GET    /profile
  PUT    /profile
  PUT    /profile/password
  DELETE /profile
  GET    /my-books
  POST   /borrow/{book_id}
  POST   /return/{record_id}

ADMIN ONLY (Bearer token + admin role):
  POST   /books
  POST   /books/{id}     ← method spoofing for file uploads
  PUT    /books/{id}
  DELETE /books/{id}
  GET    /admin/stats
  GET    /admin/users
  PUT    /admin/users/{id}/status
```

---

### Database Seeder

`DatabaseSeeder.php` uses `firstOrCreate()` — **idempotent** (safe to run multiple times, won't duplicate).

Seeds: 1 admin + 1 member + 5 categories + 10 sample books with real ISBNs.

---

## Frontend — React Application

### App Entry Points

**`index.html`**
- Loads the Dialogflow Messenger `<script>` tag in `<head>`
- Contains `<div id="root">` where React mounts
- Served for every URL by Nginx (SPA pattern)

**`src/main.tsx`**
- Calls `ReactDOM.createRoot(...).render(<App />)`
- Imports global CSS + React Toastify CSS

---

### Auth Context

`src/context/AuthContext.tsx` — provides authentication state to the entire app.

```tsx
const { user, token, loading, login, logout, register,
        setUser, isAdmin, isAuthenticated } = useAuth()
```

| Value | Type | Description |
|-------|------|-------------|
| `user` | `User \| null` | Authenticated user object |
| `token` | `string \| null` | Bearer token |
| `loading` | `boolean` | True during initial token verification |
| `isAdmin` | `boolean` | `user?.type === 'admin'` |
| `isAuthenticated` | `boolean` | `!!token && !!user` |

**On mount:** Reads `auth_token` from `localStorage` → calls `GET /api/user` to verify it's still valid → restores session or clears stale data.

**While `loading` is true:** Renders a full-screen spinner to prevent flashing wrong content.

---

### API Client

`src/api.ts` — Axios instance pre-configured with:
- `baseURL`: `http://localhost:8000/api`
- Request interceptor: attaches `Authorization: Bearer <token>` if stored
- Response interceptor: on `401` → clears storage → redirects to `/login`

---

### Components

#### Navbar — `src/components/Navbar.tsx`

Shows different links based on auth state:

```
Unauthenticated: Books | [Login button]
Member:          Books | My Books | [Name] | Logout
Admin:           Books | Admin | [Name] | Logout
```

**Mobile (≤ 768px):**
- Desktop links hidden
- Hamburger icon (☰) appears
- Click → slide-in drawer from right with all links
- Auto-closes on: link click, outside click, route change

**Body scroll is locked** while the drawer is open.

#### AddBookModal — `src/components/AddBookModal.tsx`

- Fetches categories on mount for the `<select>` dropdown
- Builds `FormData` (required for file uploads — JSON can't carry binary data)
- Sends `POST /api/books` with `Content-Type: multipart/form-data`
- Displays field-level validation errors from the server

#### EditBookModal — `src/components/EditBookModal.tsx`

Same structure as Add, with these differences:
- Pre-fills form from the `book` prop
- Sends `POST /api/books/{id}` with `_method=PUT` in FormData (method spoofing)
- If no new image is selected, the server keeps the existing one
- `onSaved` prop type is `() => void` — parent refreshes from server instead of optimistic update

---

### Pages

#### Home — `src/pages/Home.tsx`

Book catalogue with real-time search and category filters.

```
URL: /
State: books, categories, search, catId (selected category), page, loading
```

- On mount: fetches categories for filter buttons
- `fetchBooks()` runs whenever `page`, `search`, or `catId` changes
- Changing `search` or `catId` resets `page` to 1
- Book grid uses CSS `auto-fill` + `minmax` — adapts to viewport width
- Clicking a card navigates to `/books/{id}`

#### Login — `src/pages/Login.tsx`

```
URL: /login
```
- Calls `login()` from `AuthContext`
- On success: toast + navigate to `/`
- Already authenticated → immediately redirects to `/`

#### Register — `src/pages/Register.tsx`

```
URL: /register
```
- Calls `register()` from `AuthContext`
- On success: toast + navigate to `/login` (user must then log in)
- Shows field-level server validation errors

#### BookDetail — `src/pages/BookDetail.tsx`

```
URL: /books/:id
```

What's shown depends on auth state:

| Who | Sees |
|-----|------|
| Anyone | Cover, title, author, ISBN, category, description, availability |
| Member (book available, < 3 borrows) | Borrow button |
| Member (book borrowed) | "Borrowed by [name]" message |
| Admin | Edit + Delete buttons |

#### MyBooks — `src/pages/MyBooks.tsx`

```
URL: /my-books  (members only)
```

Two sections:
- **Currently Borrowed** (cards): thumbnail, title, dates, overdue badge, Return button
- **Borrowing History** (table): all returned books

#### Profile — `src/pages/Profile.tsx`

```
URL: /profile  (authenticated users only)
```

Three cards:
1. **Edit Profile** — update name and email
2. **Change Password** — requires current password verification
3. **Danger Zone** — soft-deletes account, revokes all tokens

#### AdminPanel — `src/pages/AdminPanel.tsx`

```
URL: /admin  (admins only)
```

**Stats bar** (always visible): Total Books, Total Members, Currently Borrowed, Overdue.

**Books tab:**
- Search, Add Book button, paginated table
- Edit (pencil) and Delete (trash) actions per row

**Users tab** (loaded lazily when tab is clicked):
- Search, paginated table
- Suspend / Activate toggle per user
- Soft-deleted users shown at reduced opacity with "Deleted" badge

---

### Styling

`src/index.css` — single global CSS file using CSS custom properties.

**Design tokens:**

```css
--primary: #2563eb    /* Blue — buttons, links, active states */
--success: #16a34a    /* Green — available, success */
--danger:  #dc2626    /* Red — errors, delete, suspend */
--text:    #1e293b    /* Near-black body text */
--border:  #e2e8f0    /* Light gray borders */
--bg:      #f8fafc    /* Off-white page background */
--card:    #ffffff    /* White cards and modals */
```

**Responsive breakpoints:**

| Breakpoint | Changes |
|-----------|---------|
| ≤ 768px (tablet) | Hamburger menu, 2-col stats, stacked section headers |
| ≤ 480px (mobile) | 2-col book grid, bottom-sheet modals, scrolling category filter |
| ≤ 360px (tiny) | Further density reduction |

---

## Feature Walkthroughs

### Authentication

```
Register:  POST /api/register → redirect to /login
Login:     POST /api/login → store token → redirect to /
Refresh:   On page load, GET /api/user with stored token → restore session
Logout:    POST /api/logout → clear storage → redirect to /login
```

### Borrow a Book

1. Visit a book's detail page (`/books/{id}`)
2. Click **Borrow Book** (visible if: authenticated member + book available + active borrows < 3)
3. `POST /api/borrow/{id}` → record created with `due_date = now + 14 days`
4. Book status updates to "Currently Borrowed"

### Return a Book

1. Visit **My Books** (`/my-books`)
2. Click **Return** next to an active borrow
3. `POST /api/return/{record_id}` → `returned_at` set to now
4. Book moves to Borrowing History, becomes available again

### Admin — Add a Book

1. Open **Admin Panel** → Books tab → **+ Add Book**
2. Fill in Title, Author, ISBN (10 or 13 digits), Category, optional Description and Cover Image
3. `POST /api/books` (multipart) → image stored in `storage/app/public/books/`
4. Book list and stats refresh automatically

### Admin — Suspend a User

1. Open **Admin Panel** → Users tab
2. Click **Suspend** next to a member
3. `PUT /api/admin/users/{id}/status { status: "suspended" }`
4. User cannot log in until reactivated

---

## API Reference

All responses use this envelope:
```json
{ "success": true, "message": "...", "data": { } }
```

| Method | Endpoint | Auth | Body / Query |
|--------|----------|------|-------------|
| POST | `/api/register` | — | `name, email, password, password_confirmation` |
| POST | `/api/login` | — | `email, password` |
| POST | `/api/logout` | ✅ | — |
| GET | `/api/user` | ✅ | — |
| GET | `/api/books` | — | `?page&search&category_id` |
| GET | `/api/books/{id}` | — | — |
| GET | `/api/categories` | — | — |
| POST | `/api/books` | 🔐 Admin | multipart: `title, author, isbn_no, category_id, description?, image?` |
| POST | `/api/books/{id}` | 🔐 Admin | multipart + `_method=PUT` |
| DELETE | `/api/books/{id}` | 🔐 Admin | — |
| GET | `/api/my-books` | ✅ | — |
| POST | `/api/borrow/{book_id}` | ✅ | — |
| POST | `/api/return/{record_id}` | ✅ | — |
| GET | `/api/admin/stats` | 🔐 Admin | — |
| GET | `/api/admin/users` | 🔐 Admin | `?page&search` |
| PUT | `/api/admin/users/{id}/status` | 🔐 Admin | `status: "active"\|"suspended"` |
| GET | `/api/profile` | ✅ | — |
| PUT | `/api/profile` | ✅ | `name?, email?` |
| PUT | `/api/profile/password` | ✅ | `current_password, password, password_confirmation` |
| DELETE | `/api/profile` | ✅ | — |

---

## Database Schema

```
users
├── id (PK)
├── name, email (unique), password (bcrypt)
├── type: 'admin'|'member'
├── status: 'active'|'suspended'
├── deleted_at (soft delete)
└── timestamps

categories
├── id (PK)
├── name (unique)
└── timestamps

books
├── id (PK)
├── title, author, description
├── isbn_no (unique, 10 or 13 digits)
├── image_path (nullable)
├── category_id → categories.id
└── timestamps

records
├── id (PK)
├── user_id → users.id  (CASCADE)
├── book_id → books.id  (CASCADE)
├── borrowed_at, due_date
├── returned_at (nullable — NULL = currently borrowed)
└── timestamps

personal_access_tokens  (Sanctum — auto-managed)
├── tokenable_type, tokenable_id → user
├── name, token (SHA-256 hash)
├── last_used_at, expires_at
└── timestamps
```

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| CORS error in browser | Apache headers not active | Rebuild server: `docker compose up --build --no-deps server` |
| Login fails silently | Stale localStorage token | DevTools → Application → Local Storage → Clear all for localhost:5173 |
| `Permission denied` for `storage/logs` | Volume mount overwrites build-time `chown` | Entrypoint now fixes this. Rebuild server. |
| SQL Server takes very long to start | First-time DB initialisation (~60s) | Wait — do not stop/restart. Subsequent starts are fast. |
| `server` container exits immediately | PHP error or missing env var | `docker compose logs server` — look for the first error line |
| Book images not displaying | Storage symlink missing or wrong permissions | `docker compose exec server php artisan storage:link` |
| TypeScript build error | Prop type mismatch after code change | Read the error — it includes exact file and line number |

---

## Useful Commands

```bash
# Start everything (first time)
docker compose up --build

# Start without rebuilding
docker compose up

# Rebuild only the backend (after server code changes)
docker compose up --build --no-deps server

# Rebuild only the frontend (after client code changes)
docker compose up --build --no-deps client

# Rebuild both app containers, keep database data
docker compose up --build --no-deps server client

# Full reset (wipes all data, re-seeds)
docker compose down -v && docker compose up --build

# View live logs from all containers
docker compose logs -f

# View logs from one container only
docker compose logs -f server

# Open a shell inside the server container
docker compose exec server bash

# Run Artisan commands
docker compose exec server php artisan migrate:status
docker compose exec server php artisan db:seed
docker compose exec server php artisan cache:clear
docker compose exec server php artisan config:clear
```

---

*Built with React, Laravel, and Microsoft SQL Server. Fully containerised with Docker.*
