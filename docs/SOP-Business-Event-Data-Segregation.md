# Standard Operating Procedure (SOP): Business Event Data Segregation

## Document Information
- **Version**: 1.0
- **Created**: 2025-08-27
- **Purpose**: Prevent cross-business-account data leakage in the Funko Flash application
- **Scope**: All business event related data access and RLS policies

## Overview

This SOP establishes mandatory security protocols to ensure that business users can only access events and data assigned to their specific business account. This prevents unauthorized access to other businesses' confidential information.

## Critical Security Principles

### 1. Business Account Isolation
- **Rule**: Business users MUST only see data for their assigned business account(s)
- **Enforcement**: All RLS policies for business users must include business account verification
- **Verification**: Business account assignment is validated through the `business_event_account` table

### 2. Permission Scoping
- **Rule**: No broad permissions that allow access to all data
- **Implementation**: Use scoped permissions like `calendar:view_own_business` instead of `calendar:view`
- **Validation**: Every permission must specify the scope of access

### 3. RLS Policy Design
- **Rule**: All RLS policies for business users must include business account filtering
- **Pattern**: 
  ```sql
  EXISTS (
    SELECT 1 
    FROM business_event_account bea
    JOIN business_account ba ON ba.id = bea.business_account_id
    JOIN profiles p ON p.email = ba.contact_email
    WHERE bea.event_id = [target_event_id]
      AND p.user_id = auth.uid()
      AND p.role = 'business'::app_role
  )
  ```

## Mandatory Checks Before Code Changes

### Before Creating New RLS Policies
1. **Business User Impact Check**: Does this policy affect business users?
2. **Data Scope Verification**: What data does this policy allow access to?
3. **Business Account Filtering**: Does the policy include business account verification?
4. **Cross-Business Prevention**: Can this policy allow access to other businesses' data?

### Before Modifying Existing Policies
1. **Current Scope Analysis**: What is the current access scope?
2. **Impact Assessment**: How will the change affect data isolation?
3. **Regression Testing**: Will this break existing business account segregation?

### Before Adding New Permissions
1. **Permission Scope Definition**: Is the permission appropriately scoped?
2. **Role Assignment Review**: Which roles will receive this permission?
3. **Data Access Boundaries**: What data boundaries does this permission create?

## Implementation Requirements

### Database Level
1. **RLS Policy Naming**: Use descriptive names that indicate business scope
   - Good: "Business users can view calendar events for their assigned business accounts only"
   - Bad: "Users with calendar:view can view events"

2. **Permission Naming**: Include scope in permission names
   - Good: `calendar:view_own_business`
   - Bad: `calendar:view`

3. **Audit Logging**: All business data access must be logged in `business_event_access_log`

### Application Level
1. **Component Data Fetching**: Verify that data queries respect business account boundaries
2. **State Management**: Ensure state updates don't mix data from different business accounts
3. **Error Handling**: Provide clear error messages when access is denied

## Testing Protocol

### Required Tests for Every Change
1. **Business Account Isolation Test**: Verify Jesse can only see COLLECTORS COLLISION events
2. **Cross-Business Prevention Test**: Confirm Jesse cannot see Anime Fresno events
3. **Permission Verification Test**: Validate that only appropriate permissions are granted

### Test Scenarios
1. **Single Business User**: User with one business account sees only their events
2. **Multi-Business User**: User with multiple business accounts sees all their events
3. **No Business Account**: User with no business accounts sees no events
4. **Admin/Staff Override**: Admin and staff can see all events as required

## Incident Response

### When Business Data Leakage is Detected
1. **Immediate Action**: Identify and disable the problematic RLS policy
2. **Impact Assessment**: Determine which users had unauthorized access
3. **Data Audit**: Review audit logs for unauthorized data access
4. **Policy Correction**: Implement proper business account filtering
5. **Validation**: Run comprehensive tests to verify fix
6. **Documentation**: Update this SOP with lessons learned

## Monitoring and Alerting

### Automated Monitoring
- **Database Function**: `test_business_account_isolation()` should be run regularly
- **Audit Log Review**: Monitor `business_event_access_log` for unusual patterns
- **Permission Changes**: Alert on any changes to business user permissions

### Manual Verification
- **Monthly Review**: Verify business account assignments are correct
- **Quarterly Audit**: Full review of all business-related RLS policies
- **Annual Assessment**: Complete security review of business data segregation

## Compliance Requirements

### Before Production Deployment
1. **Security Linter Clean**: No critical security warnings
2. **Business Isolation Test**: All business account isolation tests pass
3. **Permission Audit**: All permissions are appropriately scoped
4. **Documentation Update**: This SOP reflects current implementation

### Ongoing Compliance
1. **Code Review**: All business-related changes must be reviewed for data segregation
2. **Testing**: Business isolation tests must pass before any deployment
3. **Documentation**: Keep this SOP updated with any policy changes

## Emergency Procedures

### Critical Data Leakage
1. **Immediate Isolation**: Disable all business user access until issue is resolved
2. **Root Cause Analysis**: Identify the specific policy or code causing the leak
3. **Rapid Fix**: Implement emergency fix with business account filtering
4. **Validation**: Thorough testing before re-enabling business user access

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-08-27 | Initial creation after Jesse business data leakage incident | System |

---

**IMPORTANT**: This SOP is mandatory for all developers working on business event functionality. Violations of these procedures can result in serious security incidents and data breaches.