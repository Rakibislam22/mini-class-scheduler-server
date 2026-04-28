# API Documentation

## Authentication Endpoints

### POST /api/register
Creates a new user account with authentication credentials.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "student"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "user": {
    "_id": "ObjectId",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

**Response (Error 400/409):**
```json
{
  "success": false,
  "message": "Email already registered" // or other error message
}
```

---

### POST /api/login
Authenticates a user and returns their profile information.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "user": {
    "_id": "ObjectId",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

**Response (Error 401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Slot Management Endpoints

### GET /slots
Retrieves all available slots from all teachers.

**Query Parameters:** None

**Response (Success 200):**
```json
{
  "success": true,
  "slots": [
    {
      "_id": "ObjectId",
      "start": "2026-04-28T14:00:00Z",
      "end": "2026-04-28T14:15:00Z",
      "status": "Available",
      "createdBy": "teacher@example.com",
      "creatorName": "Ms. Harper"
    }
  ]
}
```

---

### GET /slots/booked
Retrieves all slots booked by a specific student.

**Query Parameters:**
- `email` (required): Student's email address

**Response (Success 200):**
```json
{
  "success": true,
  "slots": [
    {
      "_id": "ObjectId",
      "start": "2026-04-28T14:00:00Z",
      "end": "2026-04-28T14:15:00Z",
      "status": "Booked",
      "createdBy": "teacher@example.com",
      "creatorName": "Ms. Harper",
      "bookedBy": "student@example.com",
      "bookedAt": "2026-04-28T12:30:00Z"
    }
  ]
}
```

---

### GET /slots/created
Retrieves all slots created by a specific teacher.

**Query Parameters:**
- `email` (required): Teacher's email address

**Response (Success 200):**
```json
{
  "success": true,
  "slots": [
    {
      "_id": "ObjectId",
      "start": "2026-04-28T14:00:00Z",
      "end": "2026-04-28T14:15:00Z",
      "status": "Available",
      "createdBy": "teacher@example.com",
      "creatorName": "Ms. Harper"
    }
  ]
}
```

---

### POST /slots
Creates a new 15-minute classroom slot.

**Request Body:**
```json
{
  "start": "2026-04-28T14:00:00Z",
  "createdBy": "teacher@example.com",
  "creatorName": "Ms. Harper"
}
```

**Response (Success 201):**
```json
{
  "success": true,
  "slot": {
    "_id": "ObjectId",
    "start": "2026-04-28T14:00:00Z",
    "end": "2026-04-28T14:15:00Z",
    "status": "Available",
    "createdBy": "teacher@example.com",
    "creatorName": "Ms. Harper"
  }
}
```

**Response (Error 409):**
```json
{
  "success": false,
  "message": "Slot overlaps with existing slot"
}
```

---

### PUT /slots/:id/book
Books an available slot for a student.

**Request Body:**
```json
{
  "bookedBy": "student@example.com"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "slot": {
    "_id": "ObjectId",
    "start": "2026-04-28T14:00:00Z",
    "end": "2026-04-28T14:15:00Z",
    "status": "Booked",
    "createdBy": "teacher@example.com",
    "creatorName": "Ms. Harper",
    "bookedBy": "student@example.com",
    "bookedAt": "2026-04-28T12:30:00Z"
  }
}
```

**Response (Error 404/409):**
```json
{
  "success": false,
  "message": "Slot not found or already booked"
}
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "message": "Description of what went wrong"
}
```

Common HTTP Status Codes:
- `200` - Successful GET/PUT request
- `201` - Successful POST request (resource created)
- `400` - Bad request (invalid data)
- `401` - Unauthorized (invalid credentials)
- `404` - Resource not found
- `409` - Conflict (duplicate email, overlapping slot, slot already booked)
- `500` - Internal server error

---

## Security Considerations

1. **Password Security**
   - All passwords are hashed using PBKDF2-SHA-512 with 120,000 iterations
   - Random 16-byte salt generated per user
   - Passwords never sent in responses

2. **Email Normalization**
   - All emails converted to lowercase
   - Trimmed of whitespace
   - Unique constraint enforced in database

3. **Authentication**
   - No token/session required (client stores auth in localStorage)
   - Each request should include user email when required
   - Invalid credentials return generic "Invalid credentials" message (security)

4. **Slot Overlap Prevention**
   - 15-minute slots enforced
   - Overlap detection prevents double-booking
   - Overlap check: `start < existingEnd AND end > existingStart`
