# SOP: Business Event Visibility Fix Implementation

## Overview
This document outlines the comprehensive fix for business event visibility that ensures business users see exactly their assigned events in the Business Dashboard while maintaining strict security isolation.

## Key Changes Implemented

### 1. Data Model Enhancement
- **business_account_user**: Junction table linking business accounts to user profiles (replaces email-based matching)
- **talent_event**: Junction table linking events to talents with assignment order
- **travel_segments**: Financial tracking for travel costs per event
- **calendar_event.business_event_id**: Direct FK to business_events for proper relational integrity

### 2. Security (RLS Policies)
All RLS policies now use proper junction table relationships instead of fragile email string matching:

```sql
-- Business users see only their assigned calendar events
CREATE POLICY "business_users_can_view_assigned_calendar_events"
ON calendar_event FOR SELECT TO authenticated
USING (
  business_event_id IS NOT NULL AND EXISTS (
    SELECT 1 
    FROM business_events be
    JOIN business_event_account bea ON bea.event_id = be.id
    JOIN business_account_user bau ON bau.business_account_id = bea.business_account_id
    WHERE be.id = calendar_event.business_event_id
      AND bau.user_id = auth.uid()
  )
);
```

### 3. Frontend Optimization
- **v_business_calendar_events**: Optimized view for business calendar events
- **v_business_events**: Business events view with essential fields
- **v_business_travel_finance**: Travel cost rollup per event
- **NextEventCard** now uses optimized views instead of complex joins

### 4. Management Functions
- **upsert_event_assignments()**: RPC for admin to assign businesses/talents to events
- **validate_business_visibility()**: Test function to verify user can see correct events

## Validation Process

### Test Jesse's Visibility
```sql
SELECT * FROM validate_business_visibility('dsocial@live.com');
```
Expected result: `should=1 can=1` (Jesse can see exactly 1 event: "COLLECTORS COLLISION")

### Key Test Cases
1. **Business User Isolation**: Business users see only events assigned to their business account
2. **No Cross-Account Leakage**: Business A cannot see events assigned to Business B
3. **Admin/Staff Override**: Admin and staff can see all events
4. **Talent Access**: Talent can see events they're assigned to

## Critical Security Rules

### ✅ DO
- Always use `business_account_user` as the source of truth for business↔user relationships
- Use proper FK relationships (`calendar_event.business_event_id → business_events.id`)
- Join through junction tables: `business_event_account → business_account_user → profiles`
- Use optimized views (`v_business_calendar_events`) in frontend code
- Test with `validate_business_visibility()` after any changes

### ❌ NEVER
- Do not use email string matching in RLS policies
- Do not create broad "view all" permissions for business role
- Do not bypass the business_account_user junction table
- Do not modify calendar_event RLS without updating business_events RLS

## Frontend Integration

### NextEventCard Component
```typescript
// Business users - use optimized view
const { data: businessCalendarEvents } = await supabase
  .from('v_business_calendar_events')
  .select('*')
  .gte('start_date', now)
  .order('start_date', { ascending: true });
```

### Business Events List
```typescript
// Use RLS-filtered business events
const { data: events } = await supabase
  .from('business_events')
  .select('*')
  .order('start_ts', { ascending: true });
```

## Realtime Updates
Enable real-time subscriptions on key tables to keep dashboard updated:
- `business_event_account` (assignments)
- `calendar_event` (schedule changes)
- `business_account_user` (user role changes)

## Monitoring & Debugging

### Logs to Watch
- NextEventCard component logs show filtered results
- RLS policy violations in Supabase logs
- Business user assignment logs in security_audit_log

### Common Issues
1. **Empty Dashboard**: Check business_account_user table has correct user→business mapping
2. **Wrong Events**: Verify business_event_account has correct event assignments
3. **Permission Errors**: Ensure RLS policies match junction table structure

## Data Migration Notes
- Existing email-based business_account records migrated to business_account_user
- calendar_event.source_row_id data migrated to business_event_id FK
- All existing event assignments preserved during migration

## Success Criteria
✅ Jesse (dsocial@live.com) sees "COLLECTORS COLLISION" in his Business Dashboard
✅ Jesse cannot see events from other business accounts
✅ Admin/staff can manage all events
✅ Real-time updates work correctly
✅ Travel/finance modules show linked data
✅ No security warnings in linter