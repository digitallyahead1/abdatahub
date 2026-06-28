# AB Data Hub - Development Instructions

This file provides workspace-specific instructions for developing AB Data Hub.

## Project Overview

AB Data Hub is a comprehensive VTU and fintech platform consisting of:
- **Frontend**: Next.js web application with TypeScript and Tailwind CSS
- **Mobile**: Flutter app for iOS and Android
- **Backend**: NestJS API with PostgreSQL and Redis
- **Infrastructure**: Docker-based local development environment

## Development Workflow

### 1. Initial Setup
```bash
# Install dependencies for all services
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
cd mobile && flutter pub get && cd ..
```

### 2. Local Development
```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start individually
# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm run start:dev

# Mobile
cd mobile && flutter run
```

### 3. Code Organization

**Frontend** (`frontend/`):
- `app/` - Next.js App Router pages
- `components/` - Reusable React components organized by feature
- `lib/` - Utilities and helpers
- `types/` - TypeScript type definitions
- `hooks/` - Custom React hooks
- `context/` - React Context providers

**Backend** (`backend/src/`):
- `auth/` - Authentication module
- `users/` - User management
- `transactions/` - Transaction processing
- `wallet/` - Wallet operations
- `services/` - VTU services (data, airtime, etc)
- `admin/` - Admin functionality
- `config/` - Configuration
- `common/` - Shared utilities

**Mobile** (`mobile/lib/`):
- `screens/` - Application screens
- `widgets/` - Reusable widgets
- `models/` - Data models
- `services/` - API service layer
- `providers/` - State management
- `theme/` - Theme and styling

### 4. Brand Guidelines

**Colors**:
- Primary Blue: `#007BFF`, `#0066E8`
- Dark Background: `#0B0F1A`, `#101827`
- Silver/White: `#F5F7FA`, `#D9DDE4`
- Accent Blue Glow: `#00A8FF`

**Typography**: Inter, Poppins, Manrope

**Design**: Dark mode, Glassmorphism, Blue neon highlights, Smooth animations

### 5. Environment Setup

**Backend `.env`**:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/ab_data_hub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h
OTP_EXPIRATION=5m
```

**Frontend `.env.local`**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=AB Data Hub
```

### 6. Key Files

- `docker-compose.yml` - Local development environment
- `frontend/tailwind.config.ts` - Tailwind CSS configuration
- `backend/src/main.ts` - NestJS entry point
- `mobile/pubspec.yaml` - Flutter dependencies

### 7. Common Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run tests

# Backend
npm run start:dev    # Start in development mode
npm run migrate      # Run database migrations
npm run seed         # Seed database
npm run test         # Run tests

# Mobile
flutter run          # Run app
flutter build apk    # Build Android APK
flutter build ios    # Build iOS app
flutter test         # Run tests
```

### 8. Database

PostgreSQL is used for persistent data storage. Migrations are located in:
- `backend/src/database/migrations/`

Run migrations with:
```bash
npm run migrate
```

### 9. Testing

All services include test suites:
- Backend: Jest with E2E tests
- Frontend: Jest/Vitest
- Mobile: Flutter test framework

Run tests with:
```bash
npm run test          # Frontend & Backend
flutter test          # Mobile
```

### 10. Deployment

Services are containerized and ready for:
- Docker Compose (development)
- Kubernetes (production)
- Cloud platforms (AWS, Azure, GCP)

See `docs/deployment/` for detailed deployment guides.

## Architecture

### API Communication
- Frontend & Mobile communicate with Backend via REST API
- All API requests include JWT authentication
- Rate limiting and request validation implemented

### State Management
- **Frontend**: React Context + Zustand
- **Mobile**: Provider / Riverpod
- **Backend**: NestJS dependency injection

### Database
- PostgreSQL for persistent storage
- Redis for caching and sessions
- TypeORM for ORM layer

## Services & Features

### Core Services
1. **Data Subscription** (MTN, Airtel, Glo, 9mobile)
2. **Airtime Top-Up**
3. **Cable TV** (DSTV, GOTV, Startimes)
4. **Electricity Bills**
5. **Exam Pins** (WAEC, NECO, JAMB, NABTEB)
6. **POS Services**
7. **Wallet Management**
8. **Referral Program**

### User Management
- Registration & Login
- OTP Verification
- 2FA Support
- Profile Management
- Referral tracking

### Admin Functions
- User management
- Transaction monitoring
- Wallet operations
- Service pricing
- Revenue reports

## Code Standards

### TypeScript
- Strict mode enabled
- Proper type definitions required
- No `any` types without justification

### Styling
- Tailwind CSS for web
- Mobile: Flutter Material Design
- Consistent with brand colors

### Git Workflow
- Create feature branches: `feature/feature-name`
- Create bugfix branches: `bugfix/bug-name`
- PR required before merge to main
- Clear commit messages

## Support

For questions about the project structure or development process, refer to:
- `docs/` - Project documentation
- `.github/` - GitHub workflows
- Individual README files in each service directory

---

**Fast • Reliable • Always Connected**
