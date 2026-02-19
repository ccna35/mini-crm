# Mini CRM API

Production-grade Mini CRM API built with NestJS, Prisma, and PostgreSQL. A complete lead management system with business rules, real-time statistics, and comprehensive API documentation.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd mini-crm

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
```

### Database Setup

```bash
# Start PostgreSQL
npm run db:up

# Run migrations
npm run prisma:migrate

# Seed demo data (~30 leads)
npm run seed
```

### Running the Application

```bash
# Development mode with auto-reload
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

### API Documentation

- **Swagger/OpenAPI**: http://localhost:3000/docs
- **Raw OpenAPI JSON**: http://localhost:3000/docs-json

## 📁 Project Structure

```
mini-crm/
├── src/
│   ├── common/
│   │   ├── filters/          # Global exception filter
│   │   └── interceptors/     # Response transform interceptor
│   ├── database/
│   │   └── prisma.service.ts # Database client service
│   ├── modules/
│   │   ├── health/           # Health check endpoint
│   │   ├── leads/            # Lead CRUD and business logic
│   │   └── dashboard/        # Analytics and statistics
│   ├── prisma/
│   │   └── seed.ts           # Database seeding script
│   ├── app.module.ts
│   └── main.ts               # App entry point with Swagger setup
├── test/
│   └── app.e2e-spec.ts       # E2E tests
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── docker-compose.yml        # PostgreSQL dev setup
├── package.json
└── tsconfig.json
```

## 🗄️ Database

### Schema

The application uses PostgreSQL with the following main entity:

**Lead**

- `id`: UUID (cuid format)
- `name`: String
- `email`: String (unique)
- `phone`: String (optional)
- `status`: Enum (NEW, CONTACTED, PROPOSAL, ON_HOLD, WON, LOST)
- `lostReason`: String (optional, required if status is LOST)
- `nextFollowUpAt`: DateTime (optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Migrations

```bash
# Create a new migration
npm run prisma:migrate

# Reset database (⚠️ clears all data)
npm run db:reset

# View database in Prisma Studio
npm run prisma:studio
```

## 🎯 API Endpoints

### Health

- `GET /api/health` - Health check

### Leads

- `POST /api/leads` - Create a lead
- `GET /api/leads` - List leads (with pagination and filtering)
- `GET /api/leads/:id` - Get lead details
- `GET /api/leads/overdue` - Get overdue followups
- `GET /api/leads/upcoming` - Get upcoming followups (next 7 days)
- `PATCH /api/leads/:id` - Update a lead
- `DELETE /api/leads/:id` - Delete a lead

### Dashboard

- `GET /api/dashboard/stats` - Get CRM statistics and metrics

See [API.md](./API.md) for detailed endpoint documentation with examples.

## 💼 Business Rules

1. **Automatic Follow-up Date**: When a lead status becomes `PROPOSAL` without a follow-up date, it's automatically set to now + 2 days.
2. **Lost Reason Required**: If status becomes `LOST`, the `lostReason` field is required.
3. **Clear Follow-up on Won**: When status becomes `WON`, `nextFollowUpAt` is automatically cleared.
4. **Overdue Followups**: Leads with `nextFollowUpAt < now` and status in [CONTACTED, PROPOSAL, ON_HOLD] are considered overdue.

See [BUSINESS.md](./BUSINESS.md) for complete business flow documentation.

## 🧪 Testing

### Unit Tests

```bash
npm run test
npm run test:watch
npm run test:cov
```

### E2E Tests

```bash
npm run test:e2e
```

Tests use the same PostgreSQL database (see docker-compose.yml). Ensure database is running:

```bash
npm run db:up
```

## 🔧 Development

### Linting

```bash
npm run lint
```

### Code Formatting

```bash
npm run format
```

### Environment Variables

Create `.env.local` from `.env.example`:

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

## 📊 API Testing

### Postman/Apidog

Import the provided collection files:

- **Environment**: `Mini CRM API.postman_environment.json`
- **Collection**: `Mini CRM API.postman_collection.json`

Both files are importable in Postman and Apidog.

### cURL Examples

**Create a lead:**

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234"
  }'
```

**List leads:**

```bash
curl http://localhost:3000/api/leads?page=1&limit=10
```

**Update a lead:**

```bash
curl -X PATCH http://localhost:3000/api/leads/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONTACTED"
  }'
```

## 🐳 Docker

### Start PostgreSQL

```bash
npm run db:up
```

### Stop PostgreSQL

```bash
npm run db:down
```

### Reset Database

```bash
npm run db:reset
```

## 📝 Documentation

- [API.md](./API.md) - Complete API documentation with examples
- [BUSINESS.md](./BUSINESS.md) - Business logic and CRM workflow
- [Prisma Schema](./prisma/schema.prisma) - Database schema documentation

## 🔐 Error Handling

The API uses consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Invalid input data",
  "timestamp": "2024-02-19T10:00:00.000Z",
  "path": "/api/leads"
}
```

Common HTTP status codes:

- `200 OK` - Successful request
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input or business rule violation
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## 📦 Technologies

- **Runtime**: Node.js 20+
- **Framework**: NestJS 11
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Validation**: class-validator with class-transformer
- **API Docs**: Swagger/OpenAPI
- **Testing**: Jest & Supertest
- **Code Quality**: ESLint & Prettier
- **Containerization**: Docker & Docker Compose

## 🎉 Demo Data

Run `npm run seed` to populate ~30 demo leads with:

- Mix of all statuses
- Overdue and upcoming followups
- Realistic names and emails
- Various phone numbers

## 📄 License

UNLICENSED (Private)

## 🤝 Support

For issues or questions, please check the documentation files or open an issue in the repository.
