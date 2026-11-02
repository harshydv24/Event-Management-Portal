# Project Report: Event Nexus — Campus Event Management Portal

---

## 1. Project Objectives

### 1.1 Executive Summary
**Event Nexus** is a centralized, role-based web application designed to streamline, digitize, and automate the lifecycle of campus events, workshops, club activities, and departmental symposiums. It bridges the communication and coordination gap between students, student-led clubs, departmental authorities, and college administration.

### 1.2 Primary Objective
To design and develop an intuitive, scalable, and secure full-stack event management platform that eliminates manual paperwork, fragmented communication (posters, messaging groups), and inefficient event registration workflows across educational institutions.

### 1.3 Specific Objectives
* **Centralized Event Discovery**: Provide students with an interactive, categorized catalog of ongoing and upcoming campus events with advanced filtering (by department, club, date, and event type).
* **Multi-Tier Role-Based Access Control (RBAC)**: Enforce distinct privileges and views for three distinct user roles:
  * **Students**: Browse events, register individually or in teams, track registration history, and receive notifications.
  * **Club Organizers**: Create and manage events, design event itineraries, track participant registrations, issue club announcements, and monitor attendance metrics.
  * **Department Admins / Faculty**: Review and approve event proposals, oversee institutional compliance, and inspect analytics.
* **Streamlined Registration & Team Management**: Facilitate one-click individual registrations and dynamic multi-member team registrations with validation.
* **Interactive Club Ecosystem**: Provide dedicated club showcase profiles, member directories, and broadcast announcement feeds.
* **Real-Time Notification System**: Deliver automated updates regarding event approvals, schedule changes, and registration confirmations.
* **Data-Driven Analytics**: Provide event organizers with visual charts showing registration trends, department-wise participation, and engagement rates.
* **Secure, Decoupled Architecture**: Implement a production-grade decoupled system with a TypeScript Express REST API and MongoDB cloud storage, fortified by cryptographic JWT authentication.

---

## 2. Tech Stack & Tools Overview

### 2.1 Technology Architecture
```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│       React 18  •  TypeScript 5.8  •  Vite  •  Tailwind CSS           │
│       shadcn/ui (Radix Primitives)  •  TanStack Query  •  Recharts     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION / LOGIC LAYER                         │
│           Node.js (LTS)  •  Express.js 4  •  TypeScript 5.8           │
│        Firebase Admin SDK (Auth Validation)  •  Multer  •  CORS        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Mongoose ODM (TLS)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          DATA & STORAGE LAYER                          │
│     MongoDB Atlas (Cloud NoSQL)  •  Local/Cloud Media Storage          │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Complete Technology Matrix

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^18.3.1` | Core declarative UI component architecture |
| **Frontend Language** | TypeScript | `^5.8.3` | Compile-time type safety for UI state & props |
| **Build & Bundling** | Vite (SWC) | `^5.4.19` | Fast HMR dev server & optimized production bundle |
| **Styling Engine** | Tailwind CSS | `^3.4.17` | Utility-first responsive CSS styling |
| **UI Component Library**| Radix UI / shadcn | Latest | Accessible, unstyled UI primitives (Dialogs, Tabs, etc.) |
| **Icons & Typography** | Lucide React / Geist | `^0.462.0` | Vector UI icons and clean typography |
| **Data Visualization** | Recharts | `^2.15.4` | Analytics charts (attendance, registration rates) |
| **Form Management** | React Hook Form + Zod | `^7.61.1` | Form state handling and schema-based validation |
| **Server State** | TanStack Query | `^5.83.0` | Caching, deduplication, and async data synchronization |
| **Client Routing** | React Router DOM | `^6.30.4` | Dynamic SPA routing and route guards |
| **Backend Runtime** | Node.js | `>=20.0.0` | Asynchronous non-blocking JavaScript server environment |
| **Backend Framework** | Express.js | `^4.21.2` | Minimalist routing, middleware & REST API pipeline |
| **Backend Language** | TypeScript | `^5.8.3` | Type-safe controllers, models, and middlewares |
| **Execution Engine** | TSX (`tsx watch`) | `^4.19.2` | Hot-reloading TypeScript runtime for backend |
| **Database Engine** | MongoDB (Atlas Cloud) | `v7.0+` | Cloud NoSQL JSON-like document database |
| **Object Data Modeling**| Mongoose | `^8.9.5` | Schema validation, business logic hooks & query building |
| **Auth Provider** | Firebase Authentication | `^12.10.0` | Client-side user identity, password encryption, OAuth |
| **Server Auth Validation**| Firebase Admin SDK | `^13.0.2` | Cryptographic verification of client JWT Bearer tokens |
| **Real-Time Communication**| Socket.IO / Client | `^4.8.4` | Bi-directional WebSocket events for live event/notification push |
| **File Upload Handling**| Multer & Cloudinary | Latest | Local disk and cloud-native media storage for documents & banners |
| **Containerization** | Docker & Docker Compose | `v24+` | Multi-stage container builds and microservice orchestration |
| **Reverse Proxy** | Nginx Alpine | `Latest` | Production reverse proxy, static asset compression & routing |
| **Security & Utilities**| CORS, Rate Limit, Dotenv| Latest | Cross-origin policies, API rate limiting, config parsing |

---

## 3. Technologies Used & Design Justification

### 3.1 React 18 & Vite (Presentation Layer)
* **Component-Based Architecture**: Promotes high code reusability (navigation bars, event cards, modal dialogues, participant tables).
* **Virtual DOM**: Ensures smooth, rapid interface updates without reloading the entire page.
* **Vite Tooling**: Replaces older bundlers (like Webpack) with native ES module loading, cutting cold-start compilation times down to sub-seconds.

### 3.2 TypeScript (Full-Stack Type Safety)
* **Single Source of Truth**: Data models (e.g., `Event`, `User`, `Club`, `Notification`) share congruent type definitions between backend schemas and frontend UI components.
* **Error Prevention**: Catches `undefined` property access, incorrect API payloads, and missing fields at build time rather than at runtime in production.

### 3.3 Node.js & Express.js (Application Layer)
* **Event-Driven, Asynchronous I/O**: Capable of handling high volumes of simultaneous student requests (e.g., during rush registrations for popular hackathons).
* **Middleware Architecture**: Provides clean, modular separation of concerns:
  * `verifyToken`: Validates incoming authorization headers.
  * `requireProfile`: Synchronizes and retrieves the user profile.
  * `requireRole`: Enforces role-based permissions (Student vs. Club vs. Admin).
  * `errorHandler`: Centralized error catching and uniform JSON responses.

### 3.4 MongoDB Atlas & Mongoose ODM (Data Layer)
* **Flexible Document Model**: Events have varying attributes (team size limits, registration deadlines, custom categories, embedded participant arrays). MongoDB's schema-less nature paired with Mongoose's structural validation accommodates this variability better than rigid relational tables.
* **High Availability & Cloud Hosting**: MongoDB Atlas handles automatic provisioning, replication across availability zones, TLS 1.3 in-flight encryption, and automated backups.

### 3.5 Hybrid Authentication Architecture
* **Frontend (Firebase Auth)**: Manages sign-up, sign-in, session persistence, password reset tokens, and third-party identity providers without storing plaintext passwords on our servers.
* **Backend (Firebase Admin + Custom RBAC)**: Intercepts Firebase ID tokens, cryptographically verifies signatures, extracts the user `uid`, and matches it against custom role schemas stored in MongoDB. This achieves complete data sovereignty while delegating identity security to a trusted provider.

### 3.6 Radix UI & Tailwind CSS (UI & Design System)
* **Accessibility (a11y)**: Built-in ARIA attributes, keyboard navigation support, and screen-reader friendliness out of the box.
* **Custom Styling**: Fast iteration using Tailwind utility classes with a unified design palette (dark/light themes, sleek card layouts, micro-animations).

---

## 4. Hardware & Software Requirements

### 4.1 Hardware Requirements

#### A. Development & Build Machine
| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Processor** | Dual-Core 2.0 GHz (x86-64 / ARM64) | Quad-Core 2.5 GHz+ (Intel i5/i7, AMD Ryzen 5/7, Apple Silicon M-series) |
| **RAM** | 8 GB DDR4 | 16 GB DDR4/DDR5 |
| **Storage** | 10 GB available SSD storage | 25 GB+ available NVMe SSD |
| **Network** | Broadband Internet connection (5 Mbps) | High-speed Internet (25+ Mbps) |
| **Display** | 1366 x 768 resolution | 1920 x 1080 (Full HD) or higher |

#### B. Hosting / Server Environment (Production Target)
| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Compute** | 1 vCPU / Shared Core (0.5 GB RAM) | 2 vCPU / 2 GB RAM (Dedicated/Containerized) |
| **Database** | MongoDB Atlas Shared Tier (M0 - 512 MB) | MongoDB Atlas Dedicated Tier (M10+ with automated scaling) |
| **Storage Bandwidth**| 100 GB Monthly Bandwidth | 500 GB+ Monthly Bandwidth |

#### C. End-User Client Devices (Students & Administrators)
| Device Type | Minimum Specification |
| :--- | :--- |
| **Desktop / Laptop** | Any standard PC, Mac, or Chromebook with 4 GB RAM and modern browser |
| **Mobile / Tablet** | Android 9.0+ or iOS 14.0+ with modern mobile browser (Chrome/Safari) |
| **Network** | Stable 3G/4G/5G or Wi-Fi connection |

---

### 4.2 Software Requirements

#### A. Development Environment
* **Operating System**: Windows 10/11 (64-bit), macOS Monterey or higher, or Linux (Ubuntu 20.04 LTS+)
* **Runtime**: Node.js `v20.x` or higher (LTS recommended)
* **Package Manager**: `npm` (`v10.x`+) or `pnpm` / `yarn`
* **Source Code Editor**: Visual Studio Code, Antigravity IDE, or any modern editor
* **Recommended Editor Extensions**:
  * ESLint
  * Prettier - Code Formatter
  * Tailwind CSS IntelliSense
* **API Testing Tool**: Postman, Insomnia, or Thunder Client (for REST endpoint validation)
* **Version Control**: Git `v2.30+` with GitHub repository integration

#### B. Server & Cloud Services
* **Database Service**: MongoDB Atlas Cloud Account (M0 Sandbox or higher)
* **Identity Platform**: Google Firebase Console (Firebase Authentication & Service Account Key)
* **Hosting Platforms (Production Phase)**:
  * Frontend: Vercel / Netlify / Cloudflare Pages
  * Backend API: Render / Railway / AWS Elastic Beanstalk
  * Media Assets: Local Storage (Dev) / Cloudinary or AWS S3 (Prod)

#### C. End-User Software
* **Supported Web Browsers**:
  * Google Chrome (`v90` or later) — *Recommended*
  * Mozilla Firefox (`v88` or later)
  * Microsoft Edge (`v90` or later)
  * Apple Safari (`v14` or later)
  * Opera (`v76` or later)
* **JavaScript**: Enabled in browser settings (mandatory for Single Page Application operation)
