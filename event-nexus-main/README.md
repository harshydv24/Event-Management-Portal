<p align="center">
  <img src="public/images/home-logo2.png" alt="Event Management Portal" width="72" height="72" />
</p>

<h1 align="center">Event Management Portal</h1>

<p align="center">
  A college event management system with role-based access for Students, Clubs, and Departments.
  <br />
  <a href="https://event-management-portal-b5e4e.web.app/"><strong>View Live →</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" />
</p>

---

## Overview

Event Management Portal is a full-stack web application that streamlines the lifecycle of college events — from proposal submission by clubs to department approval and student registration. Three distinct dashboards cater to each user role, with real-time Firestore sync, email-verified authentication, and a Linear-inspired design system supporting light and dark modes.

## Features

### Student
- Browse all approved events with search and filtering
- Register for events with a single click
- View registered events and their status
- Receive in-app notifications for event updates

### Club
- Create event proposals with poster upload, PDF proposal, and M2M documents
- Track event status through the approval pipeline (Pending → Approved → Venue Selected → Completed)
- Manage club profile, core team, faculty advisor, and president details
- Post announcements visible to students
- View participant lists for each event

### Department (Admin)
- View all pending event proposals and approve or reject them with feedback
- Assign venues from a predefined list (auditoriums, halls, seminar rooms)
- Manage all registered clubs and their members
- Access analytics dashboard with event and participation charts

### Platform
- Firebase Authentication with mandatory email verification
- Role-based protected routing — each user lands on their own dashboard
- Real-time notifications via Firestore listeners
- Dark / Light theme toggle persisted across sessions
- Fully responsive layout

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui (Radix UI primitives) |
| State / Data | TanStack React Query, React Context |
| Forms | React Hook Form + Zod |
| Backend / DB | Firebase Auth, Firestore, Firebase Storage |
| Routing | React Router v6 |
| Charts | Recharts |
| Notifications | Sonner, custom toast hook |
| Testing | Vitest, Testing Library |
| Deployment | Firebase Hosting |

## Project Structure

```
src/
├── components/          # Shared UI components
│   ├── ui/              # shadcn/ui component library
│   ├── EventCard.tsx
│   ├── NotificationPanel.tsx
│   └── ...
├── contexts/            # React Contexts
│   ├── AuthContext.tsx       # Auth state + login/signup/logout
│   ├── EventContext.tsx      # Event CRUD operations
│   └── NotificationContext.tsx
├── pages/
│   ├── student/         # Student dashboard & events
│   ├── club/            # Club dashboard, create event, manage events
│   ├── department/      # Department dashboard (admin)
│   ├── LoginPage.tsx
│   └── VerifyEmail.tsx
├── services/            # Firestore service layer
│   ├── authService.ts
│   ├── eventService.ts
│   ├── clubService.ts
│   ├── announcementService.ts
│   ├── notificationService.ts
│   └── storageService.ts
├── types/               # Shared TypeScript interfaces & enums
│   └── index.ts         # User, Event, Club, Notification, Venue types
└── config/
    └── firebase.ts      # Firebase app initialization
```

## Event Lifecycle

```
Club creates proposal
        ↓
  pending_approval  ←── Department reviews
        ↓
  approved / rejected   (with optional feedback)
        ↓
  venue_selected    ←── Department assigns venue
        ↓
    completed
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Firebase project with **Authentication**, **Firestore**, and **Storage** enabled

### Installation

```sh
# 1. Clone the repository
git clone https://github.com/harshydv24/Event-Management-Portal.git
cd Event-Management-Portal

# 2. Install dependencies
npm install

# 3. Configure Firebase
#    Create a .env file at the project root and add your Firebase config:
cp .env.example .env   # (or create .env manually — see below)

# 4. Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server (HMR) |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |

### Deployment

The project deploys to Firebase Hosting. After configuring the Firebase CLI:

```sh
npm run build
firebase deploy
```

## Firestore Security Rules

Access is enforced server-side via Firestore rules:
- **Students** can read approved events and write their own registrations.
- **Club** users can create and update events belonging to their own club ID.
- **Department** users have read access across all collections and can approve/reject events and manage clubs.
- All write operations require an authenticated, email-verified user.

## Contributing

Contributions are welcome! If you find a bug or have an improvement in mind:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "feat: add your feature"`)
4. Push to your branch and open a Pull Request

## Team

| Name | GitHub | Role |
|---|---|---|
| Harsimran Singh | [@harsimran151](https://github.com/harsimran151) | Project Lead |
| Harsh Yadav | [@harshydv24](https://github.com/harshydv24) | Developer |
| Raushan | [@raushan8032](https://github.com/raushan8032) | Developer |
| Sangam | [@Sangamk27](https://github.com/Sangamk27) | Developer |
| Rishabh Paudel | [@rishabh-24bcs10110](https://github.com/rishabh-24bcs10110) | Developer |

---

<p align="center">If this project was helpful, consider giving it a ⭐</p>
