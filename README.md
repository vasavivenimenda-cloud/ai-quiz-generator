# AI Quiz Generator 🎓

An AI-powered quiz platform for students: enter a topic, paste study notes, or upload a PDF/text file and get a customized quiz with answers, explanations, and real-time performance tracking.

---

## ✨ Features

- **Authentication**: Secure Register/Login with JWT & bcrypt password hashing.
- **Smart AI Generation**: Generate quizzes from a topic, pasted text, or uploaded document (`.pdf` / `.txt`).
- **Difficulty Modes**: Easy, Medium, Hard, and **Adaptive** (automatically adjusts based on your last 5 quiz performances).
- **Question Types**: Single Choice (MCQ), True/False, Multiple Select, and Mixed formats.
- **Resilient AI Pipeline**: Connects with OpenAI `gpt-4o-mini`, plus an offline/demo fallback generator if API keys or quotas are unavailable.
- **Interactive Quiz Interface**:
  - One question at a time with a countdown timer.
  - Question progress bar, previous/next navigation.
  - Option to submit immediately or auto-submit on timer expiry.
  - Local session state recovery & leave-page alert.
- **Instant Result & Review**: Comprehensive breakdown showing score percentage, correct/wrong count, time taken, your answer vs correct answer, and detailed explanations.
- **Export & Share**: Browser print-to-PDF export and one-click shareable quiz links.
- **Analytics & History**: Topic search, difficulty filtering, score history chart, topic-wise bar chart, and strong/weak subject insights using Recharts.
- **User Profile & Theme**: Edit profile name, email, or password; Dark & Light mode toggle.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router v6, Recharts, Vanilla CSS (Glassmorphism & responsive layout)
- **Backend**: Node.js, Express.js, Mongoose, Multer, `pdf-parse`
- **Database**: MongoDB (Local Community Server or MongoDB Atlas)
- **AI**: OpenAI API (`gpt-4o-mini`) / Built-in demo fallback

---

## 📂 Project Structure

```text
ai-quiz-generator/
├── backend/
│   ├── controllers/      # Route controllers (auth, quizzes, attempts, users)
│   ├── middleware/       # JWT auth protector and rate limiter
│   ├── models/           # Mongoose schemas (User, Quiz, QuizAttempt)
│   ├── routes/           # Express API routes
│   ├── services/         # OpenAI integration & fallback quiz generator
│   ├── .env.example      # Example environment variables
│   ├── seed.js           # Sample demo data script
│   └── server.js         # Backend server entry point
├── frontend/
│   ├── public/           # HTML entry point and public assets
│   ├── src/
│   │   ├── components/   # Layout, logo, skeleton, empty states
│   │   ├── context/      # App context (auth, theme, toasts)
│   │   ├── pages/        # Public, Quizzes, Take, Insights
│   │   ├── services/     # Centralized fetch API client
│   │   ├── App.js        # Route definitions
│   │   ├── App.css       # Complete design system & responsive styling
│   │   └── index.js      # React DOM mounting
│   └── .env.example      # Example environment variables
├── .gitignore            # Git exclusion rules (protects keys and node_modules)
└── package.json          # Root scripts for easy multi-package commands
```

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` if not already present:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ai-quiz-generator
JWT_SECRET=your_super_secret_jwt_key_here_change_me
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
CLIENT_URL=http://localhost:3000
```
> **Note**: If `OPENAI_API_KEY` is not set or quota is expired, the system automatically uses the intelligent offline/demo mock generator so you can test all features without interruption.

### Frontend (`frontend/.env`)
```env
REACT_APP_API=http://localhost:5000/api
```

---

## 🚀 How to Run Locally

### Prerequisites
1. **Node.js** (v18 or higher recommended)
2. **MongoDB** (Local `mongod` service running or a free cloud cluster on [MongoDB Atlas](https://www.mongodb.com/atlas))

---

### Step 1: Start MongoDB
Ensure MongoDB is running locally:
```bash
mongod
```
*(Or use a MongoDB Atlas URI inside `backend/.env`)*

---

### Step 2: Start Backend Server
Open a terminal:
```bash
cd backend
npm install
npm run dev
```
The API server will start on **`http://localhost:5000`**.

*(Optional)* Seed demo data:
```bash
npm run seed
```
> Demo credentials:
> - **Email**: `demo@quiz.com`
> - **Password**: `demo123`

---

### Step 3: Start Frontend Client
Open a **new separate terminal**:
```bash
cd frontend
npm install
npm start
```
The React app will open automatically in your browser at **`http://localhost:3000`**.

---

## 📤 How to Push to GitHub

Follow these steps to push your project safely to GitHub without uploading large `node_modules` or sensitive `.env` files:

### 1. Initialize Git (if not already done)
```bash
git init
```

### 2. Check Git Status
```bash
git status
```
*Verify that `.env` files and `node_modules/` are NOT listed in untracked files.*

### 3. Stage and Commit Files
```bash
git add .
git commit -m "Initial commit: AI Quiz Generator platform"
```

### 4. Create a New Repository on GitHub
1. Go to [GitHub](https://github.com) and click **New Repository**.
2. Give it a name (e.g. `ai-quiz-generator`).
3. Leave "Initialize this repository with a README" **unchecked** (you already have one).
4. Click **Create repository**.

### 5. Link and Push to GitHub
Copy your repository URL from GitHub and run:
```bash
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git push -u origin main
```

---

## 📡 API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Login and obtain JWT token | No |
| `GET` | `/api/users/profile` | Get current user profile | Yes |
| `PUT` | `/api/users/profile` | Update profile (name, email, password) | Yes |
| `POST` | `/api/quizzes/generate` | Generate quiz from topic/text/PDF file | Yes |
| `GET` | `/api/quizzes` | List current user's quizzes | Yes |
| `GET` | `/api/quizzes/:id` | Get specific quiz questions | Yes |
| `POST` | `/api/attempts` | Submit quiz attempt & answers | Yes |
| `GET` | `/api/attempts/history` | Get quiz attempt history | Yes |
| `GET` | `/api/attempts/performance`| Get performance stats & analytics | Yes |
| `GET` | `/api/attempts/:id` | Get individual attempt result review | Yes |
