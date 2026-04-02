# Care4U — Centralized Healthcare Ecosystem

> Group D | CSC3213 | Members: S/21/081, S/21/166, S/21/389, S/21/001

## Project Structure
```
CSC3213_20_Group_D/
├── backend/       # Node.js + Express API
├── frontend/      # React + Vite web dashboard
└── mobile/        # React Native + Expo mobile app
```

## Getting Started

### Prerequisites
- Node.js v20+
- PostgreSQL 16
- Git

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # Fill in your DB password
node app.js
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Mobile Setup
```bash
cd mobile
npm install
npm run android
```

## Branch Strategy
- `main` — stable production code only
- `develop` — all features merge here first
- `feature/module-name` — one branch per feature

## Commit Format
`feat(module): description`