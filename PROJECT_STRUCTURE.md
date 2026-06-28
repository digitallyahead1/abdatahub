# Project Structure Documentation

## Complete Project Organization

```
AB Data Hub/
│
├── 📁 frontend/                          # Next.js Web Application
│   ├── app/                              # Next.js App Router
│   │   ├── (landing)/                    # Landing page group
│   │   ├── (auth)/                       # Authentication pages
│   │   ├── dashboard/                    # Dashboard pages
│   │   ├── admin/                        # Admin pages
│   │   ├── layout.tsx                    # Root layout
│   │   └── page.tsx                      # Home page
│   │
│   ├── components/                       # Reusable Components
│   │   ├── auth/                         # Login, Register, OTP
│   │   ├── dashboard/                    # Dashboard components
│   │   ├── services/                     # Service cards
│   │   ├── wallet/                       # Wallet components
│   │   ├── admin/                        # Admin components
│   │   └── common/                       # Nav, Footer, etc
│   │
│   ├── lib/                              # Utilities
│   │   ├── api.ts                        # Axios instance
│   │   └── validators.ts                 # Zod schemas
│   │
│   ├── types/                            # TypeScript types
│   ├── hooks/                            # Custom hooks
│   ├── context/                          # React Context
│   ├── styles/                           # Global CSS
│   ├── public/                           # Static assets
│   │
│   ├── package.json                      # Dependencies
│   ├── tsconfig.json                     # TypeScript config
│   ├── next.config.ts                    # Next.js config
│   ├── tailwind.config.ts                # Tailwind config
│   ├── .eslintrc.js                      # ESLint config
│   ├── .env.example                      # Environment template
│   └── README.md                         # Frontend guide
│
├── 📁 mobile/                            # Flutter Mobile App
│   ├── lib/                              # Dart source code
│   │   ├── main.dart                     # App entry point
│   │   ├── screens/                      # App screens
│   │   ├── widgets/                      # Reusable widgets
│   │   ├── models/                       # Data models
│   │   ├── services/                     # API services
│   │   ├── providers/                    # State management
│   │   ├── theme/                        # Theme config
│   │   └── utils/                        # Utilities
│   │
│   ├── assets/                           # Images, fonts
│   ├── pubspec.yaml                      # Dependencies
│   ├── .env.example                      # Environment template
│   └── README.md                         # Mobile guide
│
├── 📁 backend/                           # NestJS API Server
│   ├── src/
│   │   ├── auth/                         # Authentication
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── strategies/
│   │   │
│   │   ├── users/                        # User management
│   │   │   ├── users.module.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   │
│   │   ├── transactions/                 # Transactions
│   │   │   ├── transactions.module.ts
│   │   │   ├── transactions.service.ts
│   │   │   ├── transactions.controller.ts
│   │   │   └── dto/
│   │   │
│   │   ├── wallet/                       # Wallet operations
│   │   │   ├── wallet.module.ts
│   │   │   ├── wallet.service.ts
│   │   │   ├── wallet.controller.ts
│   │   │   └── entities/
│   │   │
│   │   ├── services/                     # VTU services
│   │   │   ├── services.module.ts
│   │   │   └── providers/                # Data, Airtime, Cable, etc
│   │   │
│   │   ├── admin/                        # Admin operations
│   │   │   ├── admin.module.ts
│   │   │   └── admin.controller.ts
│   │   │
│   │   ├── common/                       # Shared utilities
│   │   │   ├── common.module.ts
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── filters/
│   │   │   └── pipes/
│   │   │
│   │   ├── config/                       # Configuration
│   │   │   └── database.config.ts
│   │   │
│   │   ├── database/                     # Database
│   │   │   ├── init.sql
│   │   │   ├── migrations/
│   │   │   ├── seeds/
│   │   │   └── data-source.ts
│   │   │
│   │   ├── app.module.ts                 # Root module
│   │   └── main.ts                       # Entry point
│   │
│   ├── test/                             # Test files
│   ├── package.json                      # Dependencies
│   ├── tsconfig.json                     # TypeScript config
│   ├── Dockerfile                        # Docker image
│   ├── .env.example                      # Environment template
│   └── README.md                         # Backend guide
│
├── 📁 shared/                            # Shared Code
│   ├── types/                            # Shared types
│   │   └── index.ts
│   ├── constants/                        # Shared constants
│   │   ├── index.ts
│   │   └── app.config.ts
│   └── utils/                            # Shared utilities
│       └── index.ts
│
├── 📁 docs/                              # Documentation
│   ├── api/                              # API docs
│   │   └── README.md
│   ├── design/                           # Design guidelines
│   │   └── README.md
│   ├── deployment/                       # Deployment guides
│   │   └── README.md
│   └── architecture.md                   # Architecture overview
│
├── 📁 .github/                           # GitHub configuration
│   ├── workflows/                        # CI/CD workflows
│   │   ├── backend.yml
│   │   ├── frontend.yml
│   │   ├── mobile.yml
│   │   └── release.yml
│   │
│   └── copilot-instructions.md           # Copilot guidelines
│
├── 📄 docker-compose.yml                 # Docker Compose setup
├── 📄 .gitignore                         # Git ignore rules
├── 📄 .editorconfig                      # Editor config
├── 📄 .prettierrc.js                     # Prettier config
├── 📄 README.md                          # Main documentation
├── 📄 CONTRIBUTING.md                    # Contributing guide
└── 📄 LICENSE                            # License file
```

## Quick Navigation

### For Frontend Developers
- Start: `frontend/README.md`
- Config: `frontend/next.config.ts`
- Types: `frontend/types/index.ts`
- Styles: `frontend/styles/globals.css`

### For Backend Developers
- Start: `backend/README.md`
- Database: `backend/src/database/init.sql`
- API Docs: `docs/api/README.md`
- Modules: `backend/src/*/`

### For Mobile Developers
- Start: `mobile/README.md`
- Theme: `mobile/lib/theme/app_theme.dart`
- Main: `mobile/lib/main.dart`
- Assets: `mobile/assets/`

### For DevOps
- Docker: `docker-compose.yml`
- CI/CD: `.github/workflows/`
- Deployment: `docs/deployment/README.md`

### Shared Resources
- Types: `shared/types/index.ts`
- Constants: `shared/constants/`
- Utils: `shared/utils/index.ts`

## Key Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Local development environment |
| `README.md` | Project overview |
| `.github/copilot-instructions.md` | AI assistant guidelines |
| `docs/design/README.md` | Brand & design system |
| `docs/api/README.md` | API documentation |

## Development Workflow

1. **Setup**: Follow [README.md](./README.md)
2. **Backend**: See [backend/README.md](./backend/README.md)
3. **Frontend**: See [frontend/README.md](./frontend/README.md)
4. **Mobile**: See [mobile/README.md](./mobile/README.md)
5. **Deploy**: See [docs/deployment/README.md](./docs/deployment/README.md)

## Service Ports

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend API | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| PgAdmin | 5050 |
| Redis Commander | 8081 |

## Technology Stack

### Frontend
- Next.js 14+
- React 18+
- TypeScript
- Tailwind CSS
- Axios
- React Context

### Backend
- NestJS 10+
- TypeScript
- PostgreSQL
- Redis
- TypeORM
- Passport.js

### Mobile
- Flutter 3.13+
- Dart
- Provider/Riverpod
- Dio

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- GitHub Actions

---

Last Updated: 2026-06-09
