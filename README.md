# 🚀 DevCollab — Real-Time AI Dev Collaboration Platform

DevCollab is a state-of-the-art, premium full-stack developer collaboration platform. It combines real-time multi-user project workspaces, interactive Kanban project management, live code snippets, collaboratively editable Wiki pages, and an integrated Claude AI assistant to accelerate team productivity.

---

## ✨ Features

- **👥 Real-Time Multi-User Workspace:** Instant presence indicators, interactive active-user lists, and real-time updates powered by Socket.IO.
- **📋 Dynamic Kanban Board:** Seamless project management with interactive drag-and-drop task movement, priority tagging, and instant member assignments.
- **📝 Collaborative Developer Wiki:** Centralized documentation storage with live wiki page editing, revision histories, and instant team sync.
- **🤖 Integrated Claude AI Assistant:** Team-accessible AI helper to review code, summarize task updates, generate standup reports, and draft wiki articles.
- **🛡️ Secure Auth & Session Handling:** Complete signup, login, and profile authorization utilizing JWT secure tokens and bcrypt password encryption.
- **🔔 Live Notifications:** Instant real-time toast alerts and active notification lists when team members assign tasks or request code reviews.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite (for lightning-fast builds)
- **Styling:** Tailwind CSS (premium customized dark-mode aesthetics)
- **State & Sync:** Axios (HTTP calls) + Socket.IO-Client (real-time WebSocket connection)
- **Icons:** Lucide React

### Backend
- **Server:** Node.js + Express (RESTful APIs)
- **Real-Time Engine:** Socket.IO (bi-directional event-driven sync)
- **Database ORM:** Sequelize (Object-Relational Mapping for MySQL)
- **Security:** JWT (JSON Web Tokens) + BcryptJS

### Database
- **Database Engine:** MySQL 8
- **Cloud Hosting:** Aiven MySQL (production) or local MySQL workbench

---

## 📂 Project Directory Structure

```text
devcollab/
├── client/                 # React Frontend Application
│   ├── src/
│   │   ├── components/     # Reusable UI Elements (Kanban, Chat, Wiki)
│   │   ├── context/        # Socket, Auth, and Global App Contexts
│   │   ├── services/       # API Axios and Socket.IO service classes
│   │   └── App.jsx         # Main React application route layout
│   ├── package.json
│   └── vite.config.js
└── server/                 # Node.js Express Backend API Server
    ├── src/
    │   ├── config/         # Database and Claude API configurations
    │   ├── controllers/    # Route controllers (Auth, Tasks, AI, Wiki)
    │   ├── models/         # Sequelize Model Schemas (Users, Projects, etc.)
    │   ├── routes/         # Express REST API endpoints
    │   ├── socket/         # Real-time WebSockets event listeners
    │   ├── seed.js         # Production & Development DB Seeder
    │   └── app.js          # Express and HTTP socket server entrypoint
    ├── package.json
    └── .env.example
```

---

## 💻 Local Quickstart

### Prerequisites
- Node.js (v18+)
- MySQL Server running locally

### 1. Clone & Setup Backend
```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_local_mysql_password
DB_NAME=devcollab
JWT_SECRET=your_super_secure_jwt_secret_key
CLAUDE_API_KEY=your_anthropic_claude_api_key
CLIENT_URL=http://localhost:5173
```

Run database seeder to create tables and pre-populate mock data:
```bash
npm run seed
```

Start backend development server:
```bash
npm start
```

### 2. Setup Frontend
```bash
cd ../client
npm install
```

Create a `.env` file inside the `client/` directory:
```env
VITE_API_URL=http://localhost:5000
```

Start frontend Vite development server:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🌍 Production Cloud Deployment

### 1. Database Setup (Aiven Cloud MySQL)
1. Register on [Aiven.io](https://aiven.io) and create a **MySQL** service.
2. In your MySQL overview page under **Allowed IP addresses**, add `0.0.0.0/0` to allow secure connections from both your local computer and Render.
3. Keep your Host name, Port, Username, and Password handy.

### 2. Backend Deployment (Render)
1. Deploy a new Web Service on [Render](https://render.com) linked to your GitHub repository.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Under **Environment Variables**, add:
   - `PORT` = `5000`
   - `DB_HOST` = *(your Aiven Host URL)*
   - `DB_PORT` = *(your Aiven Port)*
   - `DB_USER` = `avnadmin`
   - `DB_PASS` = *(your Aiven Password)*
   - `DB_NAME` = `defaultdb`
   - `JWT_SECRET` = *(any secure random string)*
   - `CLIENT_URL` = *(your Vercel Frontend URL)*
   - `NODE_ENV` = `production`

### 3. Frontend Deployment (Vercel)
1. Import your repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Under **Environment Variables**, add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend-app.onrender.com` *(your live Render backend URL)*
4. Click **Deploy**.

---

## 🔒 Security & Optimization

- **Database Fallbacks:** Features resilient, self-healing startup wrappers that gracefully handle foreign key schema alteration conflicts and fall back to safe syncs automatically.
- **Fail-Safe Migrations:** Production deployments feature single-switch `DB_FORCE_SYNC=true` configuration overrides to reset and synchronize database structures smoothly in the cloud.
- **Production CORS:** Secured origin lists ensure only your verified frontend Vercel domain can execute authenticated socket actions and REST operations.
