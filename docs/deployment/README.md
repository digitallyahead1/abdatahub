import { Backend Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose

## Local Development

### Using Docker Compose

```bash
# Clone repository
git clone <repository-url>
cd ab-data-hub

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run start:dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Mobile
cd mobile
flutter pub get
flutter run
```

## Production Deployment

### Docker Build

```bash
# Build images
docker build -t ab-datahub-backend:latest ./backend
docker build -t ab-datahub-frontend:latest ./frontend

# Push to registry
docker push your-registry/ab-datahub-backend:latest
docker push your-registry/ab-datahub-frontend:latest
```

### Environment Variables

Create `.env` file with:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@db-host:5432/ab_data_hub
REDIS_URL=redis://:password@redis-host:6379
JWT_SECRET=your-secure-jwt-secret
PAYSTACK_SECRET_KEY=your-paystack-key
FLUTTERWAVE_SECRET_KEY=your-flutterwave-key
```

### Database Migrations

```bash
npm run migrate
npm run seed  # Optional: seed initial data
```

## Cloud Deployment

### AWS EC2

1. Launch EC2 instance (Ubuntu 22.04)
2. Install Docker & Docker Compose
3. Clone repository
4. Configure environment variables
5. Run docker-compose up -d

### AWS App Runner

1. Push Docker image to ECR
2. Create App Runner service
3. Configure environment variables
4. Deploy

### Azure App Service

```bash
# Create container registry
az acr create --resource-group <group> --name <name> --sku Basic

# Build and push image
az acr build --registry <name> --image ab-datahub-backend:latest ./backend

# Deploy to App Service
az appservice plan create --resource-group <group> --name <plan> --sku B1 --is-linux
az webapp create --resource-group <group> --plan <plan> --name <name> --deployment-container-image-name <image>
```

### Google Cloud Run

```bash
# Build and push to Cloud Build
gcloud builds submit --tag gcr.io/<project>/ab-datahub-backend

# Deploy to Cloud Run
gcloud run deploy ab-datahub-backend --image gcr.io/<project>/ab-datahub-backend --platform managed
```

## Database Setup

### PostgreSQL

```sql
CREATE DATABASE ab_data_hub;
CREATE USER abdatahub_user WITH PASSWORD 'secure_password';
ALTER ROLE abdatahub_user SET client_encoding TO 'utf8';
ALTER ROLE abdatahub_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE abdatahub_user SET default_transaction_deferrable TO on;
ALTER ROLE abdatahub_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ab_data_hub TO abdatahub_user;
```

### Run Migrations

```bash
cd backend
npm run migrate
```

## Security Checklist

- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable database encryption
- [ ] Configure Redis authentication
- [ ] Set up log aggregation
- [ ] Enable monitoring and alerts
- [ ] Configure backup strategy
- [ ] Set up WAF (Web Application Firewall)
- [ ] Enable CORS properly
- [ ] Sanitize environment variables
- [ ] Use secrets management service

## Monitoring & Logging

### Docker Logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Application Monitoring

- Set up error tracking (Sentry)
- Configure performance monitoring (New Relic, DataDog)
- Set up log aggregation (ELK, CloudWatch)

### Health Checks

```bash
# Backend health
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:3000/health
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml - Scale services
services:
  backend:
    deploy:
      replicas: 3
    ports:
      - "3001-3003:3001"
```

### Load Balancing

- Use Nginx for frontend load balancing
- Use HAProxy or AWS ELB for backend

## Backup Strategy

```bash
# PostgreSQL backup
pg_dump ab_data_hub > backup.sql

# Restore
psql ab_data_hub < backup.sql

# Redis backup (RDB)
redis-cli BGSAVE
```

## Rollback Procedure

```bash
# Rollback to previous version
docker-compose down
docker-compose pull
docker-compose up -d
```

## Troubleshooting

### Cannot connect to database

```bash
# Check connection
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### High memory usage

```bash
# Check container memory
docker stats

# Adjust limits in docker-compose.yml
services:
  backend:
    mem_limit: 512m
```

### Application crashes

```bash
# View logs
docker-compose logs backend

# Restart service
docker-compose restart backend
```

---

**For detailed deployment guides, visit the documentation folder.**
