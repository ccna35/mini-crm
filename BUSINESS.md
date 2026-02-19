# Mini CRM - Business Logic & Workflow

This document describes the business rules and workflow of the Mini CRM system.

## 📊 Lead Statuses

The CRM system manages leads through the following statuses:

### 1. **NEW**

- **Initial Status**: All new leads start with this status
- **Transitions**: Can move to CONTACTED
- **Follow-up**: Not required
- **Use Case**: Lead just entered the system, waiting for initial contact

### 2. **CONTACTED**

- **Source**: After initial contact with the lead is made
- **Transitions**: Can move to PROPOSAL, ON_HOLD, or LOST
- **Follow-up**: Optional but recommended
- **Use Case**: Sales team has reached out and established initial communication

### 3. **PROPOSAL**

- **Source**: When a sales proposal is sent to the lead
- **Business Rule**: If no `nextFollowUpAt` is set, system automatically sets it to **now + 2 days**
- **Transitions**: Can move to ON_HOLD, WON, or LOST
- **Follow-up**: Automatically scheduled if not provided
- **Use Case**: Lead received a formal proposal and is considering it

### 4. **ON_HOLD**

- **Source**: When waiting for lead feedback on proposal
- **Business Rule**: `nextFollowUpAt` can be manually set by the user
- **Transitions**: Can move to PROPOSAL, WON, or LOST
- **Follow-up**: Should be set to track when to check back
- **Use Case**: Lead is interested but needs time to decide or get budget approval

### 5. **WON**

- **Source**: When lead converts to a customer
- **Business Rule**: `nextFollowUpAt` is automatically cleared when status changes to WON
- **Transitions**: Terminal status (no further transitions)
- **Follow-up**: None required
- **Use Case**: Deal closed successfully, onboarding phase begins

### 6. **LOST**

- **Source**: When lead is no longer viable
- **Business Rule**: `lostReason` is **required** when setting status to LOST
- **Transitions**: Terminal status (no further transitions)
- **Follow-up**: None required
- **Use Case**: Lead disqualified, chose competitor, or project cancelled

## 🔄 Lead Lifecycle

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  NEW  ──→  CONTACTED  ──→  PROPOSAL  ──→  WON │
│                ↑               ↑                │
│                │               │                │
│                └──→  ON_HOLD  ─┘                │
│                ↑               ↑                │
│                └──────────┬────┘                │
│                           ↓                     │
│                        LOST                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 💼 Business Rules

### Rule 1: Auto Follow-up for PROPOSAL

**Trigger**: When lead status is changed to `PROPOSAL` without an explicit `nextFollowUpAt`

**Action**: System automatically sets `nextFollowUpAt` to `now + 2 days` (48 hours)

**Rationale**: Ensures no sales opportunity is forgotten. A 2-day follow-up gives leads time to review the proposal without losing momentum.

**Example**:

```json
// Input
{
  "status": "PROPOSAL"
}

// Output (automatically added by system)
{
  "status": "PROPOSAL",
  "nextFollowUpAt": "2024-02-21T10:00:00Z"  // If current time is 2024-02-19 10:00 UTC
}
```

### Rule 2: Lost Reason Required

**Trigger**: When lead status is changed to `LOST`

**Requirement**: `lostReason` field must be provided and non-empty

**Valid Reasons** (examples):

- Budget constraints
- Chose competitor
- Not a good fit for their needs
- Project delayed indefinitely
- Company restructuring
- Decided to build in-house solution

**Rationale**: Understanding why deals are lost helps the team improve sales strategy and product positioning.

**Example**:

```json
// ❌ INVALID - Will be rejected
{
  "status": "LOST"
}

// ✅ VALID
{
  "status": "LOST",
  "lostReason": "Budget constraints due to Q1 review"
}

// ✅ VALID - Can also update other fields
{
  "status": "LOST",
  "lostReason": "Chose competitor - TurboSales",
  "phone": "+1-555-2222"
}
```

### Rule 3: Clear Follow-up on Won

**Trigger**: When lead status is changed to `WON`

**Action**: System automatically sets `nextFollowUpAt` to `null` (clears any existing follow-up date)

**Rationale**: Won deals don't need follow-ups; they move to the onboarding/fulfillment phase.

**Example**:

```json
// Input (even if nextFollowUpAt was previously set)
{
  "status": "WON"
}

// Output (automatically cleared by system)
{
  "status": "WON",
  "nextFollowUpAt": null
}
```

## 📅 Follow-up Management

### Overdue Follow-ups

**Definition**: Leads with the following conditions:

- Status is one of: `CONTACTED`, `PROPOSAL`, `ON_HOLD`
- `nextFollowUpAt` < current timestamp

**Endpoint**: `GET /api/leads/overdue`

**Use Case**: Sales team can quickly identify leads that need immediate attention

**Example**: A lead marked PROPOSAL on Feb 18 with auto-set followup of Feb 20, but it's now Feb 22 → OVERDUE

### Upcoming Follow-ups

**Definition**: Leads with the following conditions:

- Status is one of: `CONTACTED`, `PROPOSAL`, `ON_HOLD`
- `nextFollowUpAt` is within the next 7 days
- `nextFollowUpAt` >= current timestamp

**Endpoint**: `GET /api/leads/upcoming`

**Use Case**: Help sales team plan their week and don't miss upcoming follow-ups

**Example**: Today is Feb 19, lead has followup on Feb 21 → UPCOMING

## 📈 Dashboard Metrics

The `/api/dashboard/stats` endpoint provides:

- **Total Leads**: Count of all leads in the system
- **Leads by Status**: Breakdown of leads in each status
- **Overdue Followups**: Count of leads needing immediate attention
- **Upcoming Followups**: Count of leads to follow up within 7 days
- **Win Rate**: Percentage of leads that reached WON status
- **Average Time to Win**: Average days from lead creation to WON status

### Example Response:

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

## 🎯 Common Sales Workflows

### Workflow 1: Qualified Lead Outreach

1. Lead enters system → Status: `NEW`
2. Sales rep calls/emails → Status: `CONTACTED`
3. Send proposal → Status: `PROPOSAL` (auto-set followup to +2 days)
4. Check back on followup day
5. If positive:
   - Status: `WON` (clear followup)
   - Proceed to onboarding
6. If waiting:
   - Status: `ON_HOLD`
   - Set custom followup date
7. If lost:
   - Status: `LOST`
   - Record reason

### Workflow 2: Overdue Follow-up Recovery

1. Check `GET /api/leads/overdue`
2. Review each overdue lead
3. If still interested → `PROPOSAL` or `ON_HOLD` with new followup
4. If no longer viable → `LOST` with reason

### Workflow 3: Weekly Planning

1. Check `GET /api/leads/upcoming`
2. Identify leads needing follow-up this week
3. Schedule calls/emails/check-ins
4. Update lead status based on conversation

## 🔍 Data Considerations

### Timestamps

- All timestamps are in **UTC** format (ISO 8601)
- `createdAt`: Set when lead is first created
- `updatedAt`: Updated whenever lead details change
- `nextFollowUpAt`: User-defined or auto-set, can be null

### Email Uniqueness

- Email addresses must be unique across the system
- Prevents duplicate leads in database
- System will reject attempts to create leads with duplicate emails

### Phone Number

- Optional field
- Can be null or empty string
- Stored as-is (no validation or formatting applied)

## 📊 Sample Data

The seed script generates ~30 demo leads with:

- Mix of all 6 statuses
- Realistic names and email addresses
- 50% with phone numbers
- Various follow-up scenarios

- Overdue followups (for testing overdue recovery)
- Upcoming followups (for weekly planning)
- Realistic creation dates over the last 30 days

## ⚠️ Important Notes

1. **Statuses are Case-Sensitive**: Use exact enum values (NEW, CONTACTED, PROPOSAL, ON_HOLD, WON, LOST)
2. **WON and LOST are Terminal**: These statuses cannot be changed to other statuses
3. **Follow-up Dates**: Should be in UTC format (e.g., 2024-02-21T10:00:00Z)
4. **Validation**: Input is validated using class-validator; invalid data will be rejected

## 📞 Contact & Support

For questions about business rules or workflows, refer to the API documentation at `/docs` or consult the API.md file.
