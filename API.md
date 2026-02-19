# Mini CRM API - Complete Endpoint Reference

Base URL: `http://localhost:3000/api`

All responses are wrapped in the following format:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    // actual data here
  },
  "timestamp": "2024-02-19T10:00:00.000Z"
}
```

---

## 🏥 Health Endpoints

### GET /health

Check if the API is running and healthy.

**Response**: `200 OK`

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "status": "healthy",
    "timestamp": "2024-02-19T10:30:45.123Z",
    "uptime": 1234.56
  },
  "timestamp": "2024-02-19T10:30:45.123Z"
}
```

---

## 👥 Leads Endpoints

### POST /leads

Create a new lead.

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-1234" // optional
}
```

**Validation Rules**:

- `name`: Required, string, max 255 characters
- `email`: Required, must be valid email format, must be unique
- `phone`: Optional, string

**Response**: `201 Created`

```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "id": "clh1a2b3c4d5e6f7g8h9i0j",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234",
    "status": "NEW",
    "lostReason": null,
    "nextFollowUpAt": null,
    "createdAt": "2024-02-19T10:30:45.123Z",
    "updatedAt": "2024-02-19T10:30:45.123Z"
  },
  "timestamp": "2024-02-19T10:30:45.123Z"
}
```

**Error Responses**:

- `400 Bad Request` - Invalid input

```json
{
  "statusCode": 400,
  "message": "Invalid input data",
  "timestamp": "2024-02-19T10:30:45.123Z",
  "path": "/api/leads"
}
```

- `400 Bad Request` - Email already exists

```json
{
  "statusCode": 400,
  "message": "Email already exists",
  "timestamp": "2024-02-19T10:30:45.123Z",
  "path": "/api/leads"
}
```

---

### GET /leads

List all leads with pagination and filtering.

**Query Parameters**:

| Parameter   | Type    | Default   | Description                                                     |
| ----------- | ------- | --------- | --------------------------------------------------------------- |
| `page`      | number  | 1         | Page number (1-indexed)                                         |
| `limit`     | number  | 10        | Items per page (max 100)                                        |
| `status`    | string  | -         | Filter by status (NEW, CONTACTED, PROPOSAL, ON_HOLD, WON, LOST) |
| `search`    | string  | -         | Search by name or email (partial match, case-insensitive)       |
| `isOverdue` | boolean | -         | Filter to show only overdue followups                           |
| `sortBy`    | string  | createdAt | Sort field (createdAt, updatedAt, status, nextFollowUpAt, name) |
| `sortOrder` | string  | desc      | Sort direction (asc, desc)                                      |

**Examples**:

```bash
# List first page
GET /leads

# Custom pagination
GET /leads?page=2&limit=20

# Filter by status
GET /leads?status=PROPOSAL

# Search
GET /leads?search=john

# Get overdue leads
GET /leads?isOverdue=true

# Sort by name ascending
GET /leads?sortBy=name&sortOrder=asc

# Combine filters
GET /leads?status=CONTACTED&isOverdue=false&page=1&limit=10&sortBy=nextFollowUpAt&sortOrder=asc
```

**Response**: `200 OK`

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "data": [
      {
        "id": "clh1a2b3c4d5e6f7g8h9i0j",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1-555-1234",
        "status": "PROPOSAL",
        "lostReason": null,
        "nextFollowUpAt": "2024-02-21T10:00:00.000Z",
        "createdAt": "2024-02-19T10:30:45.123Z",
        "updatedAt": "2024-02-19T10:35:20.456Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "timestamp": "2024-02-19T10:35:45.123Z"
}
```

---

### GET /leads/:id

Get a specific lead by ID.

**Path Parameters**:

- `id` (string, required): Lead ID

**Response**: `200 OK`

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "clh1a2b3c4d5e6f7g8h9i0j",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234",
    "status": "PROPOSAL",
    "lostReason": null,
    "nextFollowUpAt": "2024-02-21T10:00:00.000Z",
    "createdAt": "2024-02-19T10:30:45.123Z",
    "updatedAt": "2024-02-19T10:35:20.456Z"
  },
  "timestamp": "2024-02-19T10:35:45.123Z"
}
```

**Error Responses**:

- `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Lead with id clh123 not found",
  "timestamp": "2024-02-19T10:35:45.123Z",
  "path": "/api/leads/clh123"
}
```

---

### PATCH /leads/:id

Update a lead. Only provided fields are updated.

**Path Parameters**:

- `id` (string, required): Lead ID

**Request Body** (all fields optional):

```json
{
  "name": "John Smith",
  "phone": "+1-555-5678",
  "status": "CONTACTED",
  "lostReason": "Budget constraints",
  "nextFollowUpAt": "2024-02-23T14:30:00Z"
}
```

**Business Rules Applied**:

1. If `status` changes to `PROPOSAL` and `nextFollowUpAt` is not provided → auto-set to now + 2 days
2. If `status` changes to `LOST` → `lostReason` is required
3. If `status` changes to `WON` → `nextFollowUpAt` is automatically cleared

**Response**: `200 OK`

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "clh1a2b3c4d5e6f7g8h9i0j",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1-555-5678",
    "status": "CONTACTED",
    "lostReason": null,
    "nextFollowUpAt": null,
    "createdAt": "2024-02-19T10:30:45.123Z",
    "updatedAt": "2024-02-19T10:40:15.789Z"
  },
  "timestamp": "2024-02-19T10:40:15.789Z"
}
```

**Examples**:

```bash
# Update name
PATCH /leads/clh1a2b3c4d5e6f7g8h9i0j
{
  "name": "Jane Doe"
}

# Change status to CONTACTED
PATCH /leads/clh1a2b3c4d5e6f7g8h9i0j
{
  "status": "CONTACTED"
}

# Change status to PROPOSAL (auto-sets followup)
PATCH /leads/clh1a2b3c4d5e6f7g8h9i0j
{
  "status": "PROPOSAL"
}

# Mark as LOST with reason
PATCH /leads/clh1a2b3c4d5e6f7g8h9i0j
{
  "status": "LOST",
  "lostReason": "Budget constraints due to Q1 review"
}

# Mark as WON (clears followup)
PATCH /leads/clh1a2b3c4d5e6f7g8h9i0j
{
  "status": "WON"
}
```

**Error Responses**:

- `400 Bad Request` - Business rule violation (missing lostReason)

```json
{
  "statusCode": 400,
  "message": "lostReason is required when status is LOST",
  "timestamp": "2024-02-19T10:40:15.789Z",
  "path": "/api/leads/clh1a2b3c4d5e6f7g8h9i0j"
}
```

- `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Lead with id clh123 not found",
  "timestamp": "2024-02-19T10:40:15.789Z",
  "path": "/api/leads/clh123"
}
```

---

### DELETE /leads/:id

Delete a lead.

**Path Parameters**:

- `id` (string, required): Lead ID

**Response**: `200 OK`

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "clh1a2b3c4d5e6f7g8h9i0j",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234",
    "status": "PROPOSAL",
    "lostReason": null,
    "nextFollowUpAt": "2024-02-21T10:00:00.000Z",
    "createdAt": "2024-02-19T10:30:45.123Z",
    "updatedAt": "2024-02-19T10:35:20.456Z"
  },
  "timestamp": "2024-02-19T10:40:30.123Z"
}
```

**Error Responses**:

- `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Lead with id clh123 not found",
  "timestamp": "2024-02-19T10:40:30.123Z",
  "path": "/api/leads/clh123"
}
```

---

### GET /leads/overdue

Get all overdue followups.

**Description**: Returns leads with `nextFollowUpAt < now` and status in [CONTACTED, PROPOSAL, ON_HOLD].

**Response**: `200 OK`

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "clh1a2b3c4d5e6f7g8h9i0j",
      "name": "Overdue Lead",
      "email": "overdue@example.com",
      "phone": "+1-555-1111",
      "status": "CONTACTED",
      "lostReason": null,
      "nextFollowUpAt": "2024-02-16T10:00:00.000Z",
      "createdAt": "2024-02-10T10:00:00.000Z",
      "updatedAt": "2024-02-18T15:30:00.000Z"
    }
  ],
  "timestamp": "2024-02-19T10:40:45.123Z"
}
```

---

### GET /leads/upcoming

Get upcoming followups for the next 7 days.

**Description**: Returns leads with `nextFollowUpAt >= now` and `nextFollowUpAt <= now + 7 days` and status in [CONTACTED, PROPOSAL, ON_HOLD].

**Response**: `200 OK`

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "clh1a2b3c4d5e6f7g8h9i0j",
      "name": "Upcoming Lead",
      "email": "upcoming@example.com",
      "phone": "+1-555-2222",
      "status": "PROPOSAL",
      "lostReason": null,
      "nextFollowUpAt": "2024-02-21T14:00:00.000Z",
      "createdAt": "2024-02-15T10:00:00.000Z",
      "updatedAt": "2024-02-19T09:15:00.000Z"
    }
  ],
  "timestamp": "2024-02-19T10:40:55.123Z"
}
```

---

## 📊 Dashboard Endpoints

### GET /dashboard/stats

Get comprehensive CRM statistics and metrics.

**Response**: `200 OK`

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "totalLeads": 45,
    "leadsByStatus": {
      "NEW": 5,
      "CONTACTED": 10,
      "PROPOSAL": 15,
      "ON_HOLD": 8,
      "WON": 6,
      "LOST": 1
    },
    "overdueFollowups": 2,
    "upcomingFollowups": 7,
    "winRate": 13.33,
    "averageTimeToWin": 12
  },
  "timestamp": "2024-02-19T10:41:00.123Z"
}
```

**Fields**:

- `totalLeads` (number): Total count of all leads
- `leadsByStatus` (object): Count of leads in each status
- `overdueFollowups` (number): Count of leads needing immediate follow-up
- `upcomingFollowups` (number): Count of leads with followup scheduled within 7 days
- `winRate` (number): Percentage of leads that became WON (0-100)
- `averageTimeToWin` (number | null): Average days from creation to WON status, null if no WON leads

---

## 🔐 Error Codes

| Status Code | Meaning      | Common Causes                                            |
| ----------- | ------------ | -------------------------------------------------------- |
| `200`       | OK           | Successful GET/PATCH/DELETE                              |
| `201`       | Created      | Successful POST                                          |
| `400`       | Bad Request  | Invalid input, validation error, business rule violation |
| `404`       | Not Found    | Lead ID doesn't exist                                    |
| `500`       | Server Error | Unexpected server error                                  |

---

## 📚 Usage Examples

### cURL Examples

**Create a lead:**

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "phone": "+1-555-9876"
  }'
```

**List leads with filters:**

```bash
curl "http://localhost:3000/api/leads?status=PROPOSAL&page=1&limit=20"
```

**Search leads:**

```bash
curl "http://localhost:3000/api/leads?search=smith"
```

**Get overdue followups:**

```bash
curl http://localhost:3000/api/leads/overdue
```

**Update a lead:**

```bash
curl -X PATCH http://localhost:3000/api/leads/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PROPOSAL"
  }'
```

**Delete a lead:**

```bash
curl -X DELETE http://localhost:3000/api/leads/{id}
```

**Get dashboard stats:**

```bash
curl http://localhost:3000/api/dashboard/stats
```

### JavaScript/Node.js Examples

```javascript
// Create a lead
const response = await fetch('http://localhost:3000/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-1234',
  }),
});
const { data: newLead } = await response.json();

// List leads
const listResponse = await fetch(
  'http://localhost:3000/api/leads?page=1&limit=10',
);
const {
  data: { data: leads, total, totalPages },
} = await listResponse.json();

// Update a lead
const updateResponse = await fetch(
  `http://localhost:3000/api/leads/${newLead.id}`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'CONTACTED',
    }),
  },
);
```

---

## 📞 Support

For detailed business logic, see [BUSINESS.md](./BUSINESS.md).

For setup and development info, see [README.md](./README.md).

Access interactive API documentation at: `http://localhost:3000/docs`
