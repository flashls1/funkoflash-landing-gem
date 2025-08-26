# Manual Testing Checklist: Admin Override Functionality

## Prerequisites
- Test database with admin, staff, talent, and business users created
- Access to both admin interface (UserManagement) and user interfaces (TalentProfileSettings, etc.)
- Network tab open in browser to monitor API calls
- Console open to monitor any errors

## Test Scenario 1: Profile Data Override

### Setup
1. [ ] Create a talent user account
2. [ ] Sign in as talent user
3. [ ] Update profile information (first name, last name, phone)
4. [ ] Note the current values and timestamp

### Admin Override Test
1. [ ] Sign out and sign in as admin
2. [ ] Navigate to User Management
3. [ ] Find the talent user in the list
4. [ ] Click "View Dashboard" for that user
5. [ ] Modify the same fields with different values
6. [ ] Click "Update User"
7. [ ] Verify success message appears

### Validation
- [ ] Admin changes override user changes completely
- [ ] Updated timestamp reflects admin's changes
- [ ] Activity log records the admin action
- [ ] No errors in console or network tab

### Cross-Role Testing
Repeat the above process for:
- [ ] Staff user profile
- [ ] Business user profile
- [ ] Admin user profile (self-edit)

## Test Scenario 2: Image Upload Override

### Setup
1. [ ] Sign in as talent user
2. [ ] Navigate to Profile Settings
3. [ ] Upload a profile picture
4. [ ] Upload a hero/banner image
5. [ ] Note the image URLs

### Admin Override Test
1. [ ] Sign out and sign in as admin
2. [ ] Navigate to User Management → talent user → View Dashboard
3. [ ] Upload different profile and hero images
4. [ ] Save changes

### Validation
- [ ] Admin uploaded images replace user uploaded images
- [ ] New image URLs are stored in database
- [ ] Old images are replaced (not appended)
- [ ] Images display correctly on talent's profile

## Test Scenario 3: Password Reset Override

### Setup
1. [ ] Create talent user with known password
2. [ ] Verify user can sign in with original password

### Admin Override Test
1. [ ] Sign in as admin
2. [ ] Navigate to User Management
3. [ ] Find talent user and click "Reset Password"
4. [ ] Enter new password
5. [ ] Confirm the password reset

### Validation
- [ ] Password reset email is sent (check email logs)
- [ ] Activity log records the password reset action
- [ ] User cannot sign in with old password (after reset is complete)
- [ ] User can sign in with new password (after following reset link)

## Test Scenario 4: Real-Time Synchronization

### Setup (requires two browser windows/sessions)
1. [ ] Window 1: Admin signed in to User Management
2. [ ] Window 2: Talent user signed in to Profile Settings
3. [ ] Both viewing the same user's profile

### Real-Time Test
1. [ ] In Window 1 (admin): Make profile changes and save
2. [ ] In Window 2 (talent): Check if changes appear without refresh
3. [ ] In Window 2 (talent): Try to make conflicting changes
4. [ ] In Window 1 (admin): Verify admin changes persist

### Validation
- [ ] Admin changes appear in real-time (or after brief delay)
- [ ] User interface reflects admin changes
- [ ] Concurrent editing handles conflicts gracefully
- [ ] No data corruption occurs

## Test Scenario 5: Multi-Role Data Consistency

### Setup
1. [ ] Create one user of each role (staff, talent, business)
2. [ ] Sign in as admin

### Bulk Admin Changes
1. [ ] Navigate to User Management
2. [ ] Edit each user type with admin privileges:
   - [ ] Staff user: Change name and phone
   - [ ] Talent user: Change images and bio
   - [ ] Business user: Change business details

### Validation
- [ ] All changes save successfully across different roles
- [ ] No role-specific restrictions prevent admin access
- [ ] Data consistency maintained across all user types
- [ ] Activity logs capture all admin actions

## Test Scenario 6: Security and Audit Trail

### Admin Actions Logging
1. [ ] Perform various admin actions on user profiles
2. [ ] Check user_activity_logs table for entries
3. [ ] Verify each action is logged with:
   - [ ] Correct admin_user_id
   - [ ] Correct target user_id
   - [ ] Descriptive action type
   - [ ] Detailed information in details field
   - [ ] Accurate timestamp

### Security Validation
- [ ] Non-admin users cannot access User Management
- [ ] Non-admin users cannot edit other users' profiles
- [ ] Admin actions require proper authentication
- [ ] Sensitive data (passwords) are handled securely

## Test Scenario 7: Error Handling and Edge Cases

### Network Issues
1. [ ] Simulate network disconnection during admin update
2. [ ] Verify graceful error handling
3. [ ] Check that partial updates don't corrupt data

### Large File Uploads
1. [ ] Try uploading very large images as admin
2. [ ] Verify file size limits are enforced
3. [ ] Check that oversized uploads fail gracefully

### Concurrent Users
1. [ ] Multiple admins editing same user simultaneously
2. [ ] Admin and user editing same profile simultaneously
3. [ ] Verify data integrity is maintained

### Invalid Data
1. [ ] Try to save invalid email formats
2. [ ] Try to save phone numbers with invalid formats
3. [ ] Verify validation works for admin updates

## Success Criteria

✅ **All tests must pass for the following criteria:**

1. **Override Functionality**: Admin changes always take precedence over user changes
2. **Cross-Role Support**: Admin can edit all user roles (staff, talent, business)
3. **Real-Time Updates**: Changes appear immediately or near-immediately
4. **Data Integrity**: No corruption or partial updates
5. **Security**: Only authorized admins can perform overrides
6. **Audit Trail**: All admin actions are logged comprehensively
7. **Error Handling**: Graceful failure modes with clear error messages
8. **Performance**: Updates complete within acceptable time limits

## Failed Test Actions

If any test fails:
1. [ ] Document the specific failure condition
2. [ ] Check console logs for errors
3. [ ] Check network tab for failed API calls
4. [ ] Verify database state matches expectations
5. [ ] Test the rollback/recovery process

## Post-Testing Cleanup

1. [ ] Delete all test users created
2. [ ] Clear test activity logs if necessary
3. [ ] Remove test images from storage
4. [ ] Verify system is back to clean state

---

**Testing Notes:**
- Document any unexpected behaviors
- Note performance observations
- Record any UI/UX issues encountered
- Save screenshots of any errors or unexpected states