# SCMS - Smart College Management System

## Quick Start

```bash
git clone https://github.com/samikshatrivedi007/final-year-project.git
cd final-year-project
docker compose up --build -d
```

| Service  | Local URL                | Public (ngrok)                               |
|----------|--------------------------|----------------------------------------------|
| Client   | http://localhost:5173    | https://anemic-snowcap-happier.ngrok-free.dev |
| Server   | http://localhost:9000    | —                                            |
| MongoDB  | mongodb://localhost:27017| —                                            |
| Ngrok UI | http://localhost:4040    | —                                            |

## Manual Setup (without Docker)

### Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
