# 🎪 Event Nexus — Event Management Portal

A modern, full-featured event management portal built for college clubs and departments. Clubs can create, manage, and promote events while departments oversee approvals and announcements — all through a sleek, dark-mode-first UI.

## ✨ Features

- **Role-Based Access** — Separate dashboards for Students, Clubs, and Departments
- **Event Lifecycle** — Create, submit for approval, and publish events
- **Club Management** — Club profiles, member rosters, and event history
- **Department Oversight** — Approve/reject events, manage clubs, broadcast announcements
- **Real-Time Updates** — Powered by Firebase Firestore
- **Dark Mode First** — Linear-inspired monochromatic design system
- **Responsive Design** — Works on desktop and mobile

## 🛠️ Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Framework   | React 18 + TypeScript               |
| Build Tool  | Vite                                |
| Styling     | Tailwind CSS                        |
| UI Library  | shadcn/ui                           |
| Backend     | Firebase (Auth, Firestore, Storage) |
| Hosting     | Firebase Hosting                    |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn
- A [Firebase project](https://console.firebase.google.com/)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/harshydv24/event-nexus-main.git
cd event-nexus-main

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Then edit .env with your Firebase project credentials

# 4. Start the development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase credentials:

| Variable                            | Description                  |
| ----------------------------------- | ---------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase Web API Key         |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase Auth Domain         |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase Project ID          |
| `VITE_FIREBASE_STORAGE_BUCKET`     | Firebase Storage Bucket      |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID`             | Firebase App ID              |

You can find these in your [Firebase Console](https://console.firebase.google.com/) → Project Settings → General → Your Apps.

## 📁 Project Structure

```
event-nexus-main/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components (shadcn/ui)
│   ├── config/          # Firebase configuration
│   ├── contexts/        # React context providers (Auth, Theme)
│   ├── pages/           # Page components (Login, Dashboards)
│   │   ├── club/        # Club-specific pages
│   │   ├── department/  # Department-specific pages
│   │   └── student/     # Student-specific pages
│   ├── services/        # Firebase service layer (auth, events, clubs)
│   └── types/           # TypeScript type definitions
├── firestore.rules      # Firestore security rules
├── storage.rules        # Storage security rules
├── firebase.json        # Firebase hosting config
└── .env.example         # Environment variable template
```

## 🔒 Firebase Security

This project includes Firestore and Storage security rules (`firestore.rules`, `storage.rules`) that enforce:

- **Authentication required** for all operations
- **Role-based access control** (student, club, department)
- **Owner-only write permissions** where applicable
- **File size limits** on uploads (5–10 MB)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Team

- [Harsimran Singh](https://github.com/harsimran151) — Team Lead
- [Harsh Yadav](https://github.com/harshydv24)
- [Raushan](https://github.com/raushan8032)
- [Sangam](https://github.com/Sangamk27)
- [Rishabh Paudel](https://github.com/rishabh-24bcs10110)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

⭐ **If you found this project helpful, give it a star!**
