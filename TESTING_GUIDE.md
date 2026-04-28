# Testing Guide

## Manual Testing Checklist

### Authentication Flow

#### Test Registration
- [ ] Navigate to `/register`
- [ ] Fill form with valid data (name, email, password, select role)
- [ ] Submit form
- [ ] Verify success message appears
- [ ] Verify redirected to `/login`
- [ ] Login with registered credentials
- [ ] Verify redirected to role-specific dashboard

#### Test Login
- [ ] Navigate to `/login`
- [ ] Enter valid email and password
- [ ] Verify success message
- [ ] Verify redirected to dashboard
- [ ] Check localStorage has auth token
- [ ] Logout and verify redirected to landing
- [ ] Try login with invalid credentials
- [ ] Verify error message (generic for security)

#### Test Role-Based Access
- [ ] Login as teacher
- [ ] Verify teacher dashboard loads
- [ ] Verify slot creation form visible
- [ ] Login as student (different account)
- [ ] Verify student dashboard loads
- [ ] Verify booking interface visible
- [ ] Try accessing `/dashboard/teacher` as student
- [ ] Verify redirected to `/dashboard/student`

---

### Teacher Functionality

#### Test Slot Creation
- [ ] Login as teacher
- [ ] Verify "Teacher Dashboard" title shown
- [ ] Verify slot creation form on left column
- [ ] Enter valid date (future) and time
- [ ] Click "Add Slot"
- [ ] Verify success message with formatted date/time
- [ ] Verify slot appears in right column
- [ ] Verify form fields cleared
- [ ] Check database has new slot with correct times

#### Test Slot Creation Validation
- [ ] Try submitting without selecting date
- [ ] Verify error: "Choose both a date and a time"
- [ ] Try submitting without selecting time
- [ ] Verify error: "Choose both a date and a time"
- [ ] Try selecting past date/time
- [ ] Verify error: "Past time slots cannot be added"
- [ ] Try creating overlapping slot (same time as existing)
- [ ] Verify error: "That slot overlaps with..."
- [ ] Try submitting invalid date format
- [ ] Verify error: "The selected date and time are not valid"

#### Test Slot Viewing
- [ ] Create 3 slots at different times
- [ ] Verify all slots appear in right column
- [ ] Verify slots sorted by time (earliest first)
- [ ] Verify each slot shows:
  - [ ] Start date and time
  - [ ] Teacher name
  - [ ] Status (Available or Booked)
- [ ] Logout and login again
- [ ] Verify slots still appear (persistence)

#### Test Slot Booking (as someone else books)
- [ ] Teacher creates slot
- [ ] Teacher logs out
- [ ] Student logs in
- [ ] Verify slot appears in available slots
- [ ] Student books slot
- [ ] Verify slot status changes to "Booked" with student email
- [ ] Teacher logs back in
- [ ] Verify slot shows as "Booked" in teacher dashboard
- [ ] Verify teacher can see student email

---

### Student Functionality

#### Test Browsing Slots
- [ ] Login as student
- [ ] Verify "Available Slots" section on left
- [ ] Verify "My Booked Slots" section on right
- [ ] Create slots as teacher (in different browser/session)
- [ ] Refresh student page
- [ ] Verify available slots appear on left
- [ ] Verify each slot shows:
  - [ ] Date and time
  - [ ] Teacher name
  - [ ] "Book" button

#### Test Booking Slots
- [ ] Click "Book" button on available slot
- [ ] Verify success message: "Slot booked successfully"
- [ ] Verify slot moves from left to right column
- [ ] Verify "My Booked Slots" shows the booked slot
- [ ] Try booking same slot again (as different student)
- [ ] Verify error: "Failed to book slot" or "Slot already booked"
- [ ] Logout and login again
- [ ] Verify booked slot persists in "My Booked Slots"

#### Test Multiple Bookings
- [ ] Book 2 different slots
- [ ] Verify both appear in "My Booked Slots"
- [ ] Verify they're sorted by time
- [ ] Verify "My Booked Slots" count matches
- [ ] Verify booked slots no longer in available list

---

### UI/UX Testing

#### Test Layout (Teacher)
- [ ] Verify two-column layout
- [ ] Verify form on left, slots list on right
- [ ] Verify message display at top
- [ ] Verify header with user name and logout button
- [ ] Test responsive design (resize window)
- [ ] Verify layout still works on mobile

#### Test Layout (Student)
- [ ] Verify two-column layout
- [ ] Verify available slots on left, booked on right
- [ ] Verify message display at top
- [ ] Verify header with user name and logout button
- [ ] Test responsive design (resize window)
- [ ] Verify both columns visible on mobile

#### Test Messages
- [ ] Success message appears and is readable
- [ ] Error message appears and is readable
- [ ] Info message displays on page load
- [ ] Messages auto-clear or have close button
- [ ] Different message types have different colors

#### Test Navigation
- [ ] Header has user info displayed
- [ ] Logout button works correctly
- [ ] Browser back button behaves correctly
- [ ] Direct URL access works (e.g., `/dashboard/teacher`)
- [ ] Invalid routes redirect appropriately

---

### Data Persistence Testing

#### Test LocalStorage
- [ ] Open browser DevTools (F12)
- [ ] Go to Application > LocalStorage
- [ ] Login to application
- [ ] Verify "mini-class-scheduler-auth" key exists
- [ ] Check it contains user name, email, role
- [ ] Refresh page
- [ ] Verify still authenticated (auth data persists)
- [ ] Logout
- [ ] Verify auth key is removed

#### Test Database Persistence
- [ ] Create slot as teacher
- [ ] Stop and restart backend server
- [ ] Verify slot still exists
- [ ] Create account, logout
- [ ] Restart backend
- [ ] Verify can login with same credentials

---

### API Testing (using curl or Postman)

#### Test Register Endpoint
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "student"
  }'
```

Expected response: `{ "success": true, "user": {...} }`

#### Test Login Endpoint
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected response: `{ "success": true, "user": {...} }`

#### Test Get All Slots
```bash
curl http://localhost:3000/slots
```

Expected response: `{ "success": true, "slots": [...] }`

#### Test Create Slot
```bash
curl -X POST http://localhost:3000/slots \
  -H "Content-Type: application/json" \
  -d '{
    "start": "2026-04-28T14:00:00Z",
    "createdBy": "teacher@example.com",
    "creatorName": "Ms. Harper"
  }'
```

Expected response: `{ "success": true, "slot": {...} }`

#### Test Book Slot
```bash
curl -X PUT http://localhost:3000/slots/[SLOT_ID]/book \
  -H "Content-Type: application/json" \
  -d '{
    "bookedBy": "student@example.com"
  }'
```

Expected response: `{ "success": true, "slot": {...} }`

---

### Performance Testing

#### Test Page Load Time
- [ ] Open DevTools (F12) > Network tab
- [ ] Reload page
- [ ] Check load time (should be < 2 seconds)
- [ ] Check bundle sizes
- [ ] Verify no 404 errors

#### Test Slow Network
- [ ] DevTools > Network > Throttle (3G/LTE)
- [ ] Verify page still loads and works
- [ ] Verify error handling for slow requests
- [ ] Check message feedback during loading

#### Test Database Performance
- [ ] Create 100+ slots
- [ ] Verify listing still responsive
- [ ] Verify filter/sort still fast
- [ ] Check backend response times

---

### Security Testing

#### Test Email Validation
- [ ] Try registering with invalid email (no @)
- [ ] Verify error message
- [ ] Try registering with email missing domain
- [ ] Verify error message
- [ ] Use email with spaces
- [ ] Verify stripped/normalized

#### Test Password Security
- [ ] Never see plaintext password in network requests
- [ ] Verify password hash varies each time (salt randomness)
- [ ] Try weak password
- [ ] Verify strength requirement (if any)
- [ ] Check password not visible in localStorage

#### Test Injection Attacks
- [ ] Try email with special characters: `' OR '1'='1`
- [ ] Verify handled safely
- [ ] Try slot name with HTML: `<script>alert('xss')</script>`
- [ ] Verify sanitized or escaped
- [ ] Try database injection in API calls
- [ ] Verify proper parameter handling

#### Test Authorization
- [ ] Logout, manually set auth in localStorage
- [ ] Refresh and verify not accepted
- [ ] Edit email in localStorage to different user
- [ ] Verify cannot access that user's data
- [ ] Verify cannot book/create slots as that user

---

## Automated Testing (Future)

### Unit Tests (Jest)
```javascript
// Test password hashing
test('passwords hash consistently with same salt', () => {
  const password = 'test123';
  const salt = 'abc123';
  const hash1 = hashPassword(password, salt);
  const hash2 = hashPassword(password, salt);
  expect(hash1.hash).toBe(hash2.hash);
});
```

### Integration Tests
```javascript
// Test full auth flow
test('user registration and login', async () => {
  const res1 = await register({ email, password, name, role });
  expect(res1.success).toBe(true);
  
  const res2 = await login({ email, password });
  expect(res2.user.email).toBe(email);
});
```

### E2E Tests (Cypress)
```javascript
// Test teacher slot creation
it('should allow teacher to create slot', () => {
  cy.login('teacher@example.com', 'password');
  cy.get('input[name="slotDate"]').type('2026-04-28');
  cy.get('input[name="slotTime"]').type('14:00');
  cy.get('button').contains('Add Slot').click();
  cy.contains('Slot added').should('be.visible');
});
```

---

## Bug Reporting Template

When you find an issue, create report with:

```
**Title:** [Brief description]

**Steps to Reproduce:**
1. Login as teacher
2. Navigate to dashboard
3. Click "Add Slot"
4. [More steps...]

**Expected Behavior:**
Slot should appear in list

**Actual Behavior:**
Slot does not appear

**Browser/Environment:**
- OS: Windows 10
- Browser: Chrome 91
- Server: localhost:3000

**Screenshots/Console Errors:**
[If available]
```
