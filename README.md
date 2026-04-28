# Mini Class Scheduler Server

Express + MongoDB backend for the Mini Class Scheduler app. This server provides authentication, slot creation, slot booking, and role-based slot queries for the frontend.

## What This Backend Does

- Register users as `teacher` or `student`
- Log users in with secure password verification
- Create 15-minute class slots
- Prevent overlapping slot creation
- Book available slots
- Return a student's booked slots
- Return a teacher's created slots
- Persist data in MongoDB

## Features Implemented

### Authentication
- `POST /api/register` to create a new account
- `POST /api/login` to authenticate an existing account
- Passwords are hashed with PBKDF2-SHA-512
- Emails are normalized to lowercase before storing and querying

### Slot Management
- `GET /slots` to fetch all slots
- `GET /slots/booked?email=...` to fetch a student's booked slots
- `GET /slots/created?email=...` to fetch a teacher's created slots
- `POST /slots` to create a new 15-minute slot
- `PUT /slots/:id/book` to book an available slot
- Overlap checks prevent duplicate time ranges

### Data Storage
- MongoDB `users` collection for user accounts
- MongoDB `slots` collection for schedule data
- Unique index on user email
- Unique index on slot start time
- Query indexes for slot filtering

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB running locally or a MongoDB Atlas connection string

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in this folder:

```env
PORT=3000
DB_NAME=mini_class_scheduler
MONGO_URI=mongodb://127.0.0.1:27017/mini_class_scheduler
```

If you use MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

## How to Run

### Start the server

```bash
npm start
```

The server will start on `http://localhost:3000` by default.

### Health check

Open the root route in your browser or use curl:

```bash
curl http://localhost:3000/
```

Expected response:

```json
{
  "success": true,
  "message": "Welcome to the Mini Class Scheduler Server."
}
```

## API Overview

### Authentication

- `POST /api/register`
- `POST /api/login`

### Slots

- `GET /slots`
- `GET /slots/booked?email=user@example.com`
- `GET /slots/created?email=teacher@example.com`
- `POST /slots`
- `PUT /slots/:id/book`

For full request and response examples, see:
- [API Documentation](./API_DOCUMENTATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)

## Example Requests

### Register a user

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ms. Harper",
    "email": "teacher@example.com",
    "password": "password123",
    "role": "teacher"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'
```

### Create a slot

```bash
curl -X POST http://localhost:3000/slots \
  -H "Content-Type: application/json" \
  -d '{
    "start": "2026-04-28T14:00:00.000Z",
    "createdBy": "teacher@example.com",
    "creatorName": "Ms. Harper"
  }'
```

### Book a slot

```bash
curl -X PUT http://localhost:3000/slots/<SLOT_ID>/book \
  -H "Content-Type: application/json" \
  -d '{
    "bookedBy": "student@example.com"
  }'
```

## Project Structure

```text
mini-class-scheduler-server/
├── index.js
├── package.json
├── README.md
├── API_DOCUMENTATION.md
├── DATABASE_SCHEMA.md
├── DEPLOYMENT_GUIDE.md
├── TESTING_GUIDE.md
└── COMMIT_SUMMARY.md
```

## Notes

- Slot duration is fixed at 15 minutes.
- The server returns generic login errors to avoid exposing account details.
- Teacher and student email values are normalized before database lookup.
- Slot creation and booking are protected by server-side validation.

## Related Frontend

The frontend lives in the sibling folder:

- `../mini-class-scheduler`

It uses this backend through the configured API base URL.
