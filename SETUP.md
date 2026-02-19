# Mini CRM API - Complete Setup & Deployment Guide

## 📋 Prerequisites Checklist

- [ ] Node.js 20 or higher installed
- [ ] npm or yarn package manager
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] PostgreSQL client tools (optional, for command-line access)
- [ ] Git for version control

Verify versions:

```bash
node --version          # Should be 20.x or higher
npm --version           # Should be 10.x or higher
docker --version        # Should be 24.x or higher
docker-compose --version # Should be 2.x or higher
```

---

## 🚀 Initial Setup (First Time)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repo-url>
cd mini-crm

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env.local

# Verify .env.local has correct values
cat .env.local
```

**Default values in .env.local** (modify if needed):

```env
DATABASE_URL=postgresql://crm_user:crm_password@localhost:5432/mini_crm?schema=public
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=crm_user
DB_PASSWORD=crm_password
DB_NAME=mini_crm
```

### 3. Start PostgreSQL Database

```bash
# Initialize and start PostgreSQL container
npm run db:up

# Verify the database is running
docker ps | grep mini-crm-postgres

# Wait for database to be ready (healthcheck)
sleep 5
```

### 4. Setup Database Schema

```bash
# Run migrations to create tables
npm run prisma:migrate

# Option: Create a new migration (for future changes)
# npm run prisma:migrate -- --name "migration_name"
```

### 5. Seed Demo Data

```bash
# Populate ~30 demo leads
npm run seed

# Output should show:
# ✅ Created 30 demo leads
# 📊 Lead distribution: ...
# ⏰ Overdue followups: ...
# 🎉 Seed completed successfully!
```

### 6. Start the Development Server

```bash
# Terminal 1: Start NestJS in watch mode
npm run start:dev

# Wait for "🚀 Mini CRM API is running on http://localhost:3000"
# And "📚 API Documentation: http://localhost:3000/docs"
```

### 7. Verify Setup

```bash
# Terminal 2: Test health endpoint
curl http://localhost:3000/api/health

# Test root endpoint
curl http://localhost:3000/api

# Open browser to verify Swagger docs
open http://localhost:3000/docs
# or on Windows
start http://localhost:3000/docs
# or on Linux
xdg-open http://localhost:3000/docs
```

---

## 📊 Database Management

### View Database with Prisma Studio

```bash
# Opens interactive database viewer at http://localhost:5555
npm run prisma:studio
```

### Reset Database (⚠️ Clears All Data)

```bash
# This DELETES all tables and data, then recreates them
npm run db:reset

# Then re-seed if needed
npm run seed
```

### Manually Run SQL Queries

```bash
# Access PostgreSQL container directly
docker exec -it mini-crm-postgres psql -U crm_user -d mini_crm

# Inside psql:
# \dt            - List tables
# \d "Lead"      - Describe Lead table
# SELECT * FROM "Lead"; - View all leads
# \q             - Quit
```

### Database Backups

```bash
# Backup database to SQL file
docker exec mini-crm-postgres pg_dump -U crm_user mini_crm > backup.sql

# Restore from backup
cat backup.sql | docker exec -i mini-crm-postgres psql -U crm_user -d mini_crm
```

---

## 🧪 Testing

### Run Unit Tests

```bash
# Run all unit tests once
npm run test

# Watch mode - re-runs on file changes
npm run test:watch

# Coverage report
npm run test:cov
# Opens coverage/index.html
```

### Run E2E Tests

```bash
# E2E tests require database to be running
npm run db:up

# Run E2E tests
npm run test:e2e

# or with coverage
npm run test:e2e -- --coverage
```

### Test Endpoints with cURL

```bash
# Health check
curl http://localhost:3000/api/health | jq

# List leads
curl http://localhost:3000/api/leads | jq

# Create lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "email": "test@example.com"
  }' | jq

# Get dashboard stats
curl http://localhost:3000/api/dashboard/stats | jq
```

---

## 🔧 Development Workflow

### Code Format & Lint

```bash
# Format code with Prettier
npm run format

# Lint code with ESLint (auto-fixes issues)
npm run lint
```

### Create a New Migration

```bash
# Update schema.prisma first, then:
npm run prisma:migrate

# Follow the prompts to name your migration
# Example: "add_company_field"

# Migrations are stored in: prisma/migrations/
```

### Build for Production

```bash
# Compile TypeScript to JavaScript
npm run build

# Output is in: dist/

# Run compiled version
npm run start:prod
```

---

## 📚 API Testing Tools

### Using Swagger/OpenAPI Dashboard

1. Start the app: `npm run start:dev`
2. Open: http://localhost:3000/docs
3. Expand endpoints to test them directly
4. Use "Try it out" button in Swagger

### Import into Postman/Insomnia

**Option A: Import from URL**

```
http://localhost:3000/docs-json
```

**Option B: Import from File**

1. Start app: `npm run start:dev`
2. Export spec: See "Export OpenAPI Spec" below

**Option C: Use Provided Collection**

1. Open Postman
2. Import: `Mini CRM API.postman_collection.json`
3. Import environment: `Mini CRM API.postman_environment.json`
4. Update `baseUrl` variable if needed

### Export OpenAPI Spec

```bash
# Requires app running on port 3000
npm run start:dev &

# Wait a moment then export
sleep 2
bash scripts/export-openapi.sh

# Generates: openapi.json (and openapi.yaml if yq is installed)
```

---

## 🐳 Docker Management

### View Container Logs

```bash
# PostgreSQL logs
docker logs mini-crm-postgres

# Follow logs in real-time
docker logs -f mini-crm-postgres
```

### Stop All Services

```bash
npm run db:down

# Or manually:
docker-compose down
```

### Completely Reset Docker Setup

```bash
# Remove containers and volumes (⚠️ deletes data)
docker-compose down -v

# Start fresh
npm run db:up
npm run prisma:migrate
npm run seed
```

---

## 🚢 Deployment

### Production Build

```bash
# Install production dependencies only
npm ci --omit=dev

# Build the application
npm run build

# Start production server
npm run start:prod
```

### Using Docker (Production-Ready)

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY src ./src
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start:prod"]
```

Build and run:

```bash
docker build -t mini-crm-api:1.0.0 .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@postgres:5432/mini_crm" \
  mini-crm-api:1.0.0
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?schema=public

# Optional
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
```

---

## ⚠️ Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run start:dev
```

### Database Connection Error

```bash
# Check Docker is running
docker ps

# Verify database container
docker logs mini-crm-postgres

# Check connection string in .env.local
cat .env.local

# Try resetting database
npm run db:reset
```

### Migration Errors

```bash
# Reset migrations (⚠️ clears data)
npm run db:reset

# Manually mark migration as applied
npx prisma migrate resolve --applied

# See migration history
npx prisma migrate status
```

### Tests Failing

```bash
# Ensure database is running
npm run db:up

# Clear test database and re-migrate
docker exec mini-crm-postgres dropdb mini_crm_test || true
npm run test:e2e
```

---

## 📖 Documentation Files

- **README.md** - Quick start and overview
- **API.md** - Complete endpoint reference with examples
- **BUSINESS.md** - Business rules and CRM workflow
- **SETUP.md** - This file, detailed setup guide
- **prisma/schema.prisma** - Database schema

---

## ✅ Quick Checklist for New Developer

- [ ] Prerequisites installed and verified
- [ ] Repository cloned
- [ ] `npm install` completed
- [ ] `.env.local` created from `.env.example`
- [ ] Database running: `npm run db:up`
- [ ] Migrations applied: `npm run prisma:migrate`
- [ ] Demo data seeded: `npm run seed`
- [ ] Dev server running: `npm run start:dev`
- [ ] Swagger docs accessible: http://localhost:3000/docs
- [ ] Tests passing: `npm run test:e2e`

---

## 🆘 Need Help?

1. **API Documentation**: http://localhost:3000/docs (when running)
2. **Business Logic**: Read [BUSINESS.md](./BUSINESS.md)
3. **API Endpoints**: Read [API.md](./API.md)
4. **Database Issues**: Check `docker logs mini-crm-postgres`
5. **Application Issues**: Check terminal logs from `npm run start:dev`

---

## 📞 Common Commands Reference

| Command                  | Purpose                           |
| ------------------------ | --------------------------------- |
| `npm install`            | Install dependencies              |
| `npm run start:dev`      | Start dev server with auto-reload |
| `npm run build`          | Build for production              |
| `npm run test`           | Run unit tests                    |
| `npm run test:e2e`       | Run E2E tests                     |
| `npm run lint`           | Lint and fix code                 |
| `npm run format`         | Format code with Prettier         |
| `npm run db:up`          | Start PostgreSQL                  |
| `npm run db:down`        | Stop PostgreSQL                   |
| `npm run db:reset`       | Reset database                    |
| `npm run prisma:migrate` | Create/apply migrations           |
| `npm run prisma:studio`  | Open Prisma Studio GUI            |
| `npm run seed`           | Populate demo data                |

---

Last Updated: February 19, 2024
