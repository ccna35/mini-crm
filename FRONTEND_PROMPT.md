# Build a Frontend for Mini CRM Application

## Project Overview
Build a modern, responsive web application for a Mini CRM (Customer Relationship Management) system that helps sales teams manage leads through their lifecycle from initial contact to conversion.

## API Information

**Base URL**: `http://localhost:3000/api`

**Response Format**: All API responses are wrapped in this structure:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { /* actual data here */ },
  "timestamp": "2024-02-19T10:00:00.000Z"
}
```

## Data Model

### Lead Object
```typescript
{
  id: string;              // UUID
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: "NEW" | "CONTACTED" | "PROPOSAL" | "ON_HOLD" | "WON" | "LOST";
  source: string | null;   // e.g., "Facebook", "LinkedIn"
  value: number | null;    // Expected deal value
  nextFollowUpAt: string | null;  // ISO datetime
  notes: string | null;
  lostReason: string | null;
  createdAt: string;       // ISO datetime
  updatedAt: string;       // ISO datetime
}
```

## Available API Endpoints

### 1. Health Check
- **GET** `/health`
- Returns: `{ status: "healthy", timestamp: string, uptime: number }`

### 2. Dashboard Stats
- **GET** `/dashboard/stats`
- Returns:
```json
{
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
}
```

### 3. Create Lead
- **POST** `/leads`
- Body:
```json
{
  "name": "John Doe",           // Required
  "email": "john@example.com",  // Optional
  "phone": "+1-555-1234",       // Optional
  "company": "Tech Inc.",       // Optional
  "source": "LinkedIn",         // Optional
  "value": 5000.50,            // Optional
  "notes": "Interested in..."   // Optional
}
```

### 4. List Leads (with Pagination & Filtering)
- **GET** `/leads`
- Query Parameters:
  - `page` (number, default: 1)
  - `limit` (number, default: 10, max: 100)
  - `status` (NEW|CONTACTED|PROPOSAL|ON_HOLD|WON|LOST)
  - `search` (string - searches name and email)
  - `isOverdue` (boolean - filters overdue followups)
  - `sortBy` (createdAt|updatedAt|status|nextFollowUpAt|name, default: createdAt)
  - `sortOrder` (asc|desc, default: desc)
- Returns:
```json
{
  "data": [/* array of leads */],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### 5. Get Single Lead
- **GET** `/leads/:id`
- Returns: Lead object

### 6. Update Lead
- **PATCH** `/leads/:id`
- Body (all fields optional):
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1-555-5678",
  "company": "New Corp",
  "source": "Facebook",
  "value": 7500,
  "status": "CONTACTED",
  "lostReason": "Budget constraints",  // Required if status = LOST
  "nextFollowUpAt": "2024-02-23T14:30:00Z",
  "notes": "Updated notes"
}
```

### 7. Delete Lead
- **DELETE** `/leads/:id`
- Returns: Deleted lead object

### 8. Get Overdue Followups
- **GET** `/leads/overdue`
- Returns: Array of leads with nextFollowUpAt < now and status in [CONTACTED, PROPOSAL, ON_HOLD]

### 9. Get Upcoming Followups
- **GET** `/leads/upcoming`
- Returns: Array of leads with followups scheduled in next 7 days

## Business Rules (Important!)

### Status Workflow
```
NEW → CONTACTED → PROPOSAL → WON
                      ↓
                  ON_HOLD
                      ↓
                   LOST
```

### Automatic Behaviors

1. **Auto Follow-up for PROPOSAL**: When status changes to PROPOSAL without a `nextFollowUpAt`, the system automatically sets it to current time + 2 days

2. **Lost Reason Required**: When status changes to LOST, `lostReason` field is required (validation error if missing)

3. **Clear Follow-up on WON**: When status changes to WON, `nextFollowUpAt` is automatically cleared

### Lead Statuses Explained
- **NEW**: Just entered the system, awaiting initial contact
- **CONTACTED**: Initial communication established
- **PROPOSAL**: Formal proposal sent, awaiting decision
- **ON_HOLD**: Waiting for client feedback/approval
- **WON**: Deal closed successfully (terminal status)
- **LOST**: Opportunity lost (terminal status, requires reason)

## Required Features

### 1. Dashboard Page
- Display key metrics from `/dashboard/stats`
- Show total leads count
- Display leads breakdown by status (chart/cards)
- Show overdue and upcoming followups count
- Display win rate percentage
- Show average time to win (in days)

### 2. Leads List Page
- Table/grid view of all leads
- Pagination controls
- Filters by status
- Search by name/email
- Sort by different fields
- Visual indicators for overdue followups
- Quick actions (view, edit, delete)
- Create new lead button

### 3. Lead Detail/Edit Page
- View all lead information
- Edit lead details
- Update status with proper validation
- Set/update follow-up dates
- Display timestamps (created, updated)
- Delete lead option

### 4. Create Lead Form
- Form with all lead fields
- Proper validation (name required, email format, etc.)
- Handle API errors gracefully

### 5. Followups View
- Separate tab/view for overdue followups
- Separate tab/view for upcoming followups
- Quick update functionality

## UI/UX Recommendations

- Use color coding for lead statuses (e.g., green for WON, red for LOST, yellow for PROPOSAL)
- Show warnings for overdue followups
- Provide status workflow visualization
- Implement responsive design for mobile/tablet
- Add loading states and error handling
- Use toast notifications for success/error messages
- Implement confirmation dialogs for delete actions
- Show validation errors clearly

## Technical Requirements

- Modern JavaScript framework (React, Vue, or Angular)
- State management for API data
- Form validation
- HTTP client for API calls
- Responsive CSS framework (optional: Tailwind, Material-UI, Bootstrap)
- Date/time picker for follow-up scheduling
- Charts library for dashboard visualizations (optional: Chart.js, Recharts)

## Error Handling

Handle these HTTP status codes:
- `200/201`: Success
- `400`: Bad request (show validation errors)
- `404`: Not found (show user-friendly message)
- `500`: Server error (show generic error message)

---

**Start by building the dashboard and leads list pages first, then add create/edit functionality.**
