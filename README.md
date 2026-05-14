# ML Trade — AI Trading Platform (Web UI)

A modern, premium React frontend for the ML Trade algorithmic trading platform. Built with React + Vite + TailwindCSS.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Styling | TailwindCSS 3 (CSS variables theme system) |
| State | Zustand (auth + theme) |
| Routing | React Router v6 |
| HTTP | Axios (auto-inject Bearer token) |
| Charts | Recharts |
| Animation | Framer Motion |
| Icons | Lucide React |

## Features

- **Light / Dark Mode** — toggle in navbar, persisted to localStorage, auto-detects system preference
- **Remember Login** — token persisted across sessions, auto-restore on browser restart
- **Responsive** — mobile-first, collapsible sidebar, hamburger menu on mobile
- **Page Transitions** — smooth Framer Motion animations between routes
- **Real-time ready** — connects to FastAPI backend at `http://localhost:8000`

## Pages

| Page | Path | Description |
|---|---|---|
| Login | `/login` | Authentication with remember me |
| Dashboard | `/dashboard` | KPIs, equity curve, recent signals |
| Strategies | `/strategies` | Strategy cards, toggle active/inactive |
| Backtest | `/backtest` | Run backtests, view history & analytics |
| ML Models | `/models` | Model metrics, train buttons, feature importance |
| Trades | `/trades` | Trade history with filters |
| Portfolio | `/portfolio` | Account cards, open positions, risk metrics |
| Settings | `/settings` | Profile, brokers, API keys, system toggles |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- ML Trade FastAPI backend running at `http://localhost:8000`

### Install & Run

```bash
npm install
npm run dev
```

App runs at **http://localhost:3000**

Vite automatically proxies `/api/*` → `http://localhost:8000` — no CORS issues in dev.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── api/              # Axios API clients (auth, strategies, backtest, ...)
├── components/
│   ├── charts/       # EquityChart, PnLBarChart, DrawdownChart
│   ├── layout/       # Sidebar, Navbar, AppLayout
│   └── ui/           # Button, Card, Badge, Table, Modal, Input, ...
├── pages/            # Route-level page components
├── store/            # Zustand stores (authStore, themeStore)
└── index.css         # CSS variables for light/dark theme system
```

## Color System

The theme uses CSS custom properties — switching between light and dark just toggles the `.dark` class on `<html>`.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FFFFFF` | `#0F1115` |
| `--surface` | `#F7F8FA` | `#161A23` |
| `--border` | `#E5E7EB` | `#2A2F3A` |
| `--text` | `#111827` | `#F9FAFB` |
| `--muted` | `#6B7280` | `#9CA3AF` |
| `--accent` | `#2563EB` | `#3B82F6` |
| `--success` | `#10B981` | `#34D399` |
| `--danger` | `#EF4444` | `#F87171` |

## Backend Requirements

This frontend is designed for the **ML Trade FastAPI backend**. The backend must have CORS configured:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## ⚠️ Security Notes

The following are intentionally excluded from this repository:

- `.env` files and any environment-specific config
- API keys, tokens, secrets
- Trained ML model files (`*.joblib`, `*.pkl`)
- Databases (`*.db`, `*.sqlite`)
- Log files
- User credentials

---

Built with ❤️ for algorithmic trading — 2026
