# Backend Development Guide

## Overview

The AB Data Hub backend is a NestJS API that provides secure, scalable backend services for the VTU platform.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
cd backend
npm install
cp .env.example .env
```

### Development

```bash
npm run start:dev
```

Runs on `http://localhost:3001`

### Build & Production

```bash
# Build
npm run build

# Start production
npm start

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

---

## Project Structure

```
backend/src/
├── auth/              # Authentication module
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── strategies/    # Passport strategies
├── users/             # User management
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   ├── entities/      # TypeORM entities
│   └── dto/           # Data transfer objects
├── transactions/      # Transaction handling
├── wallet/            # Wallet operations
├── services/          # VTU services
├── admin/             # Admin functionality
├── common/            # Shared utilities
├── config/            # Configuration
├── database/          # Database setup & migrations
├── main.ts            # Application entry point
└── app.module.ts      # Root module
```

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env`:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/ab_data_hub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
```

---

## Database

### Setup

```bash
# Run migrations
npm run migrate

# Create new migration
npm run migrate:create -- -n MigrationName

# Revert migration
npm run migrate:revert

# Seed database
npm run seed
```

### TypeORM

Entities are TypeScript classes decorated with `@Entity()`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  email: string

  @Column()
  passwordHash: string
}
```

---

## Modules

### Authentication

**Features:**
- User registration & login
- JWT token management
- OTP verification
- Two-factor authentication

**Key Files:**
- `auth.service.ts` - Business logic
- `auth.controller.ts` - API endpoints
- `strategies/` - Passport strategies

### Users

**Features:**
- User profile management
- User verification
- Referral tracking

**Endpoints:**
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/users/referral`

### Transactions

**Features:**
- Data purchases
- Airtime transactions
- Cable TV subscriptions
- Electricity bills
- Exam pins

**Endpoints:**
- `POST /api/transactions/data`
- `POST /api/transactions/airtime`
- `GET /api/transactions/history`

### Wallet

**Features:**
- Wallet balance management
- Wallet funding
- Transaction history

**Endpoints:**
- `GET /api/wallet/balance`
- `POST /api/wallet/fund`
- `GET /api/wallet/history`

---

## API Standards

### Request/Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { /* payload */ }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### DTOs (Data Transfer Objects)

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string
}
```

### Validation

NestJS uses `class-validator` for request validation:

```typescript
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto)
}
```

---

## Services & Providers

### Redis Caching

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject } from '@nestjs/common'

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager
  ) {}

  async getUser(id: string) {
    const cached = await this.cacheManager.get(`user:${id}`)
    if (cached) return cached

    const user = await this.userRepository.findOne({ where: { id } })
    await this.cacheManager.set(`user:${id}`, user, 3600000)
    return user
  }
}
```

### Authentication Guards

```typescript
import { AuthGuard } from '@nestjs/passport'

@UseGuards(AuthGuard('jwt'))
@Get('profile')
getProfile(@Request() req) {
  return req.user
}
```

---

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Example Test

```typescript
import { Test } from '@nestjs/testing'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
```

---

## Error Handling

### Custom Exceptions

```typescript
import { HttpException, HttpStatus } from '@nestjs/common'

throw new HttpException(
  { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
  HttpStatus.UNAUTHORIZED
)
```

---

## Logging

```typescript
import { Logger } from '@nestjs/common'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  async login(email: string) {
    this.logger.log(`User login attempt: ${email}`)
  }
}
```

---

## Security

### Password Hashing

```typescript
import * as bcrypt from 'bcryptjs'

const hash = await bcrypt.hash(password, 10)
const isValid = await bcrypt.compare(password, hash)
```

### Rate Limiting

```typescript
import { ThrottlerModule } from '@nestjs/throttler'

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
})
export class AppModule {}
```

---

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

---

## Troubleshooting

### Database connection error

```bash
# Check connection
nc -zv localhost 5432

# Check environment variables
cat .env
```

### Port already in use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Passport.js Documentation](http://www.passportjs.org)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

---

## Support

For questions or issues, refer to:
- GitHub Issues
- Documentation
- Team Slack channel
