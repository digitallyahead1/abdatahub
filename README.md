# AB Data Hub - Premium VTU & Fintech Platform

![AB Data Hub Logo](frontend/public/logo.png)

**Fast • Reliable • Always Connected**

A modern, premium, fintech-grade Virtual Top-Up (VTU) platform offering seamless data purchases, airtime, cable TV subscriptions, electricity bills, exam pins, and POS services.

## 🎯 Project Overview

AB Data Hub is a complete VTU and fintech solution designed with:
- **Professional Design**: Premium fintech interface inspired by Opay, PalmPay, Moniepoint
- **Secure Transactions**: JWT authentication, OTP verification, 2FA support
- **Multi-Platform**: Web, Mobile (Android/iOS), Admin Dashboard
- **Fast & Reliable**: Real-time transaction processing with Redis caching
- **Scalable Architecture**: Microservices-ready backend with PostgreSQL

## 🏗️ Project Structure

```
AB Data Hub/
├── frontend/                # Next.js Web Application
│   ├── app/                 # App Router pages
│   ├── components/          # Reusable UI components
│   ├── public/              # Static assets
│   ├── styles/              # Tailwind CSS styles
│   ├── lib/                 # Utilities and helpers
│   ├── types/               # TypeScript types
│   ├── hooks/               # Custom React hooks
│   └── context/             # React Context API
│
├── mobile/                  # Flutter Mobile App (iOS & Android)
│   ├── lib/
│   │   ├── screens/         # App screens
│   │   ├── widgets/         # Reusable widgets
│   │   ├── models/          # Data models
│   │   ├── services/        # API services
│   │   ├── providers/       # State management
│   │   ├── theme/           # Theme configuration
│   │   └── utils/           # Utilities
│   └── assets/              # Images & resources
│
├── backend/                 # NestJS API Server
│   ├── src/
│   │   ├── auth/            # Authentication module
│   │   ├── users/           # User management
│   │   ├── transactions/    # Transaction handling
│   │   ├── wallet/          # Wallet operations
│   │   ├── services/        # VTU services (data, airtime, etc)
│   │   ├── admin/           # Admin module
│   │   ├── common/          # Shared utilities
│   │   ├── config/          # Configuration
│   │   └── database/        # Database setup
│   └── test/                # Test files
│
├── shared/                  # Shared utilities & types
│   ├── types/               # Shared TypeScript types
│   ├── constants/           # Global constants
│   └── utils/               # Shared utilities
│
├── docs/                    # Documentation
│   ├── api/                 # API documentation
│   ├── design/              # Design guidelines
│   └── deployment/          # Deployment guides
│
├── .github/                 # GitHub workflows & CI/CD
│
├── docker-compose.yml       # Local development environment
└── README.md                # This file
```

## 🎨 Brand Guidelines

### Colors
- **Primary Blue**: #007BFF, #0066E8
- **Dark Background**: #0B0F1A, #101827
- **Silver/White**: #F5F7FA, #D9DDE4
- **Accent Blue Glow**: #00A8FF

### Typography
- Inter
- Poppins
- Manrope

### Design System
- Dark Mode Primary Theme
- Glassmorphism Effects
- Blue Neon Highlights
- Soft Shadows
- Smooth Animations

## 🚀 Features

### For Users
- ✅ Data Subscription (MTN, Airtel, Glo, 9mobile)
- ✅ Airtime Top-Up
- ✅ Cable TV Subscriptions (DSTV, GOTV, Startimes)
- ✅ Electricity Bills (All Nigerian DisCos)
- ✅ Exam Pins (WAEC, NECO, JAMB, NABTEB)
- ✅ POS Services
- ✅ Secure Wallet System
- ✅ Referral Program
- ✅ Transaction History
- ✅ 24/7 Support

### For Admins
- 📊 User Management & Verification
- 💰 Transaction Monitoring
- 💳 Wallet Management
- 📈 Revenue Analytics
- ⚙️ Service Pricing Configuration
- 📋 Comprehensive Reports

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context / Zustand
- **HTTP Client**: Axios / Fetch API
- **UI Components**: Shadcn/UI or custom components

### Mobile
- **Framework**: Flutter
- **State Management**: Provider / Riverpod
- **HTTP Client**: Dio
- **Local Storage**: Hive / SQLite

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT + OTP
- **API Documentation**: Swagger
- **Testing**: Jest + E2E tests

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Deployment**: Cloud-ready (AWS, Azure, GCP)
- **Environment**: Node.js 18+, PostgreSQL 14+, Redis 7+

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose
- Flutter SDK (for mobile development)

### Quick Start with Docker

```bash
# Clone repository
git clone <repo-url>
cd ab-data-hub

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend npm run migrate

# Access services
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Admin: http://localhost:3000/admin
```

### Manual Setup

#### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

#### Backend
```bash
cd backend
npm install
npm run start:dev
# Runs on http://localhost:3001
```

#### Mobile
```bash
cd mobile
flutter pub get
flutter run
```

## 🔐 Environment Configuration

Create `.env` files in each service:

### Backend `.env`
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/ab_data_hub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h
OTP_EXPIRATION=5m
PAYSTACK_PUBLIC_KEY=your_key
FLUTTERWAVE_PUBLIC_KEY=your_key
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=AB Data Hub
```

## 📱 Service Offerings

### Data Services
- MTN, Airtel, Glo, 9mobile subscriptions
- Multiple data plan options
- Instant delivery

### Airtime Services
- All major networks
- Instant top-up
- 24/7 availability

### Utilities
- Electricity bills (All Nigerian DisCos)
- Cable TV (DSTV, GOTV, Startimes)
- Exam pins (WAEC, NECO, JAMB, NABTEB)

### Additional Services
- POS cash withdrawal
- Fund transfers
- Wallet funding (Paystack, Flutterwave, Moniepoint)

## 📊 API Endpoints

### Auth
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/refresh-token` - Token refresh

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/referral` - Get referral info

### Transactions
- `POST /api/transactions/data` - Buy data
- `POST /api/transactions/airtime` - Buy airtime
- `GET /api/transactions/history` - Transaction history

### Wallet
- `GET /api/wallet/balance` - Get balance
- `POST /api/wallet/fund` - Fund wallet
- `GET /api/wallet/history` - Wallet history

See [API Documentation](docs/api/README.md) for complete endpoints.

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
cd frontend
npm run test

# Mobile tests
cd mobile
flutter test
```

## 📚 Documentation

- [API Documentation](docs/api/README.md)
- [Design Guidelines](docs/design/README.md)
- [Deployment Guide](docs/deployment/README.md)
- [Database Schema](docs/database/schema.md)

## 🚢 Deployment

### Docker Deployment
```bash
# Build images
docker-compose build

# Deploy
docker-compose up -d
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis connection verified
- [ ] SSL certificates installed
- [ ] Backup strategy in place
- [ ] Monitoring setup
- [ ] Log aggregation configured

See [Deployment Guide](docs/deployment/README.md) for detailed instructions.

## 👥 Team

- **Project Name**: AB Data Hub
- **Contact**: 07045357195
- **Support**: 24/7 Support Available

## 📄 License

This project is proprietary and confidential.

## 🤝 Contributing

See [Contributing Guidelines](CONTRIBUTING.md) (if applicable).

## 📞 Support

For support, contact: support@abdatahub.com

---

**Built with ❤️ for fast, reliable, and always connected financial services in Nigeria.**
