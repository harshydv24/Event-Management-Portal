# 🎟️ Event Management Portal

> A web portal for creating, managing, and registering for events, built to make event organisation simple for both organisers and attendees.

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

<!-- TODO: replace/add badges for your stack, e.g. Node, React, Django, Java, etc. -->

---

## 📑 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 📖 About the Project

Event Management Portal lets organisers publish and manage events while attendees can browse, register, and track the events they are part of.

**Problem it solves:** [TODO: 1–2 lines, e.g. replaces scattered spreadsheets and forms for college/club events.]

**Demo:** [TODO: add live link if deployed]

---

## ✨ Features

**For Attendees / Students**
- Sign up and log in securely
- Browse and search upcoming events
- Register / cancel registration for events
- View registered events and details

**For Organisers / Admins**
- Create, edit, and delete events
- Manage registrations and attendee lists
- Role-based access (admin / organiser / user)
- [TODO: add notifications, reports, QR check-in, etc. if implemented]

> Edit this list so it matches what the project actually does.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | [TODO: e.g. HTML/CSS/JS, React, Angular] |
| Backend | [TODO: e.g. Node.js + Express, Django, Spring Boot] |
| Database | [TODO: e.g. MySQL, MongoDB, SQLite] |
| Auth | [TODO: e.g. JWT, sessions] |
| Tools | Git, GitHub, [TODO: Postman, Docker, etc.] |

---

## 📸 Screenshots

<!-- Add images to a /screenshots folder and link them here -->

| Home | Event Details | Admin Dashboard |
|------|---------------|-----------------|
| ![Home](screenshots/home.png) | ![Event](screenshots/event.png) | ![Admin](screenshots/admin.png) |

---

## 📁 Project Structure

```
Event-Management-Portal/
├── [TODO: paste your real folder tree here]
└── README.md
```

> Tip: generate it with `tree -L 2 -I node_modules` (or `tree /F` on Windows).

---

## 🚀 Getting Started

### Prerequisites

- Git
- [TODO: e.g. Node.js v18+ and npm / Python 3.10+ / JDK 17]
- [TODO: database, e.g. MySQL / MongoDB]

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/harshydv24/Event-Management-Portal.git

# 2. Move into the project folder
cd Event-Management-Portal

# 3. Install dependencies
# [TODO: replace with your stack's command]
npm install
```

### Environment Variables

Create a `.env` file in the project root (or backend folder):

```env
PORT=3000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=event_portal
JWT_SECRET=your_secret_key
```

> Never commit your real `.env` file. Add it to `.gitignore`.

### Database Setup

```bash
# [TODO: e.g. import schema or run migrations]
```

### Run the Project

```bash
# [TODO: replace with your start command]
npm start
```

Then open **http://localhost:3000** in your browser.

---

## 💡 Usage

1. Register a new account or log in.
2. Browse the events list and open an event for details.
3. Click **Register** to join an event.
4. Admins can log in to the dashboard to create and manage events.

---

## 🔌 API Endpoints

<!-- Remove this section if the project has no REST API -->

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/events` | List all events |
| GET | `/api/events/:id` | Get event details |
| POST | `/api/events` | Create event (admin) |
| PUT | `/api/events/:id` | Update event (admin) |
| DELETE | `/api/events/:id` | Delete event (admin) |
| POST | `/api/events/:id/register` | Register for an event |

> Replace with your real routes.

---

## 🗺️ Roadmap

- [ ] Email confirmations for registrations
- [ ] Event categories and filters
- [ ] QR-code based check-in
- [ ] Analytics dashboard for organisers
- [ ] Deployment (Vercel / Render / AWS)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author

**Harsh Yadav**
- GitHub: [@harshydv24](https://github.com/harshydv24)
