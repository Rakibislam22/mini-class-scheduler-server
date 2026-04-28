# Database Schema Documentation

## Overview
Mini Class Scheduler uses MongoDB for persistent data storage with the following collections:

---

## Collections

### Users Collection
Stores user account information with authentication credentials.

**Collection Name:** `users`

**Schema:**
```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  name: String,                     // User's full name
  email: String,                    // Email address (unique, indexed)
  passwordHash: String,             // PBKDF2-SHA-512 hash
  passwordSalt: String,             // Random 16-byte hex salt
  role: String,                     // "teacher" or "student"
  createdAt: Date,                  // Account creation timestamp
}
```

**Indexes:**
- `email`: UNIQUE - Ensures one account per email, case-insensitive
- `role`: Regular - Enables fast filtering by role

**Constraints:**
- `email`: Must match pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- `role`: Must be "teacher" or "student"
- `passwordHash`: Never null
- `passwordSalt`: Never null

**Example Document:**
```json
{
  "_id": ObjectId("60d5ec49c1234567890abcde"),
  "name": "John Doe",
  "email": "john@example.com",
  "passwordHash": "abc123def456...",
  "passwordSalt": "fedcba9876543210...",
  "role": "student",
  "createdAt": ISODate("2026-04-28T10:00:00Z")
}
```

---

### Slots Collection
Stores classroom availability slots created by teachers and booked by students.

**Collection Name:** `slots`

**Schema:**
```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  start: Date,                      // Slot start time (ISO 8601, unique)
  end: Date,                        // Slot end time (always start + 15 minutes)
  status: String,                   // "Available" or "Booked"
  createdBy: String,                // Teacher's email (lowercase)
  creatorName: String,              // Teacher's display name
  bookedBy: String,                 // Student's email (if status="Booked")
  bookedAt: Date,                   // When the slot was booked (if booked)
  createdAt: Date,                  // When the slot was created
}
```

**Indexes:**
- `start`: UNIQUE - Ensures no overlapping 15-minute slots
- `status`: Regular - Enables fast filtering by availability
- `createdBy`: Regular - Teachers can quickly find their slots

**Constraints:**
- `start` and `end`: Must be >= current time
- `end`: Always exactly 15 minutes after `start`
- `status`: Must be "Available" or "Booked"
- `createdBy`: Must be lowercase email
- If `status="Booked"`: `bookedBy` and `bookedAt` must be set
- If `status="Available"`: `bookedBy` and `bookedAt` must be null

**Example Document (Available):**
```json
{
  "_id": ObjectId("60d5ec49c1234567890abcde"),
  "start": ISODate("2026-04-28T14:00:00Z"),
  "end": ISODate("2026-04-28T14:15:00Z"),
  "status": "Available",
  "createdBy": "teacher@example.com",
  "creatorName": "Ms. Harper",
  "bookedBy": null,
  "bookedAt": null,
  "createdAt": ISODate("2026-04-28T10:00:00Z")
}
```

**Example Document (Booked):**
```json
{
  "_id": ObjectId("60d5ec49c1234567890abcde"),
  "start": ISODate("2026-04-28T14:00:00Z"),
  "end": ISODate("2026-04-28T14:15:00Z"),
  "status": "Booked",
  "createdBy": "teacher@example.com",
  "creatorName": "Ms. Harper",
  "bookedBy": "student@example.com",
  "bookedAt": ISODate("2026-04-28T12:30:00Z"),
  "createdAt": ISODate("2026-04-28T10:00:00Z")
}
```

---

## Data Relationships

### User → Slots (Teacher)
- A teacher creates multiple slots
- **Relationship:** One-to-Many
- **Foreign Key:** `slots.createdBy` references `users.email`
- **Query:** `db.slots.find({ createdBy: teacher_email })`

### User → Slots (Student)
- A student can book multiple slots
- **Relationship:** One-to-Many
- **Foreign Key:** `slots.bookedBy` references `users.email`
- **Query:** `db.slots.find({ bookedBy: student_email, status: "Booked" })`

---

## Normalization Rules

### Email Normalization
All emails are normalized to **lowercase** for consistency:
- On registration: email converted to lowercase
- On login: email converted to lowercase
- On slot operations: emails converted to lowercase
- Example: `John@Example.COM` → `john@example.com`

---

## Query Patterns

### Find all available slots
```javascript
db.slots.find({ status: "Available" })
  .sort({ start: 1 })
```

### Find slots created by teacher
```javascript
db.slots.find({ createdBy: teacher_email })
  .sort({ start: 1 })
```

### Find slots booked by student
```javascript
db.slots.find({ bookedBy: student_email, status: "Booked" })
  .sort({ start: 1 })
```

### Check for overlapping slots
```javascript
db.slots.findOne({
  start: { $lt: new_end },
  end: { $gt: new_start }
})
```

### Get user by email
```javascript
db.users.findOne({ email: normalized_email })
```

---

## MongoDB Connection Configuration

**Environment Variables:**
```
MONGO_URI=mongodb://127.0.0.1:27017/mini_class_scheduler
DB_NAME=mini_class_scheduler
```

**Connection String Examples:**

Local MongoDB:
```
mongodb://127.0.0.1:27017/mini_class_scheduler
```

MongoDB Atlas (Cloud):
```
mongodb+srv://username:password@cluster.mongodb.net/mini_class_scheduler
```

---

## Performance Considerations

1. **Indexes for Speed**
   - `users.email` is UNIQUE - Fast lookups by email
   - `slots.start` is UNIQUE - Prevents duplicates and enables fast overlap detection
   - `slots.status` regular index - Fast filtering of Available/Booked slots
   - `slots.createdBy` regular index - Teachers quickly find their slots

2. **Database Size Estimates**
   - Users collection: ~500 bytes per document (name, email, role, hashes)
   - Slots collection: ~400 bytes per document (times, emails, status)
   - 100 users + 1000 slots ≈ 500 KB total data

3. **Recommended Queries**
   - Always sort slots by `start` time
   - Always use indexed fields in WHERE clauses
   - Limit results when possible (pagination)

---

## Backup & Recovery

**Recommended Backup Strategy:**
```bash
# Backup MongoDB
mongodump --uri "mongodb://localhost:27017" --out ./backups

# Restore MongoDB
mongorestore --uri "mongodb://localhost:27017" ./backups
```

**Critical Collections to Backup:**
- `users` (authentication data)
- `slots` (scheduling data)
