# Deployment & Setup Guide

## Local Development Setup

### Prerequisites
- Node.js v14+ and npm
- MongoDB v4.4+ (local or Atlas cloud)
- Git

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd mini-class-scheduler-all
```

### Step 2: Setup Backend Server

1. Navigate to backend directory:
```bash
cd mini-class-scheduler-server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with MongoDB connection:
```bash
cat > .env << EOF
MONGO_URI=mongodb://127.0.0.1:27017/mini_class_scheduler
DB_NAME=mini_class_scheduler
PORT=3000
EOF
```

4. Start the server:
```bash
npm start
```

Expected output:
```
Server is running on http://localhost:3000
✓ Database connected and ready
```

### Step 3: Setup Frontend (in new terminal)

1. Navigate to frontend directory:
```bash
cd mini-class-scheduler
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Expected output:
```
Local:        http://localhost:5173/
```

### Step 4: Verify Installation

1. Open browser and navigate to `http://localhost:5173`
2. You should see the Landing page
3. Click "Register" to create a test account
4. Create account with role "teacher" or "student"
5. Login and test features

---

## Production Deployment

### Build Frontend for Production

```bash
cd mini-class-scheduler
npm run build
```

Output goes to `dist/` folder (ready for hosting).

### Deploy Frontend

**Option 1: Deploy to Vercel**
```bash
npm install -g vercel
vercel login
vercel
# Follow prompts to deploy
```

**Option 2: Deploy to GitHub Pages**
```bash
# Update vite.config.js base to: base: '/mini-class-scheduler/'
npm run build
# Push dist/ to gh-pages branch
```

**Option 3: Deploy to traditional web server**
```bash
npm run build
# Upload contents of dist/ to your web server (Apache/Nginx)
```

### Setup Backend for Production

**Option 1: Deploy to Heroku**
```bash
heroku login
heroku create mini-class-scheduler-server
heroku config:set MONGO_URI="your_mongodb_uri"
git push heroku main
```

**Option 2: Deploy to AWS EC2**
```bash
# SSH into instance
ssh -i key.pem ec2-user@instance-ip

# Setup Node.js and PM2
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install nodejs
sudo npm install -g pm2

# Clone and setup
git clone <repo>
cd mini-class-scheduler-server
npm install
pm2 start index.js --name "scheduler"
```

**Option 3: Deploy with Docker**

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

Deploy:
```bash
docker build -t scheduler-server .
docker run -e MONGO_URI="mongodb://..." -p 3000:3000 scheduler-server
```

---

## Environment Configuration

### Backend Environment Variables

```env
# MongoDB Connection
MONGO_URI=mongodb://127.0.0.1:27017/mini_class_scheduler
# OR for MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mini_class_scheduler

# Database Name
DB_NAME=mini_class_scheduler

# Server Port
PORT=3000
```

### Frontend Environment Variables (Vite)

Create `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:3000
```

For production:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## Database Setup

### Local MongoDB

1. Install MongoDB:
   - Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
   - macOS: `brew install mongodb-community`
   - Linux: `sudo apt-get install -y mongodb`

2. Start MongoDB:
```bash
# Windows (if installed as service)
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

3. Verify connection:
```bash
mongo
# Should connect to MongoDB shell
```

### MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (M0 free tier recommended)
3. Create database user with credentials
4. Get connection string from "Connect" button
5. Format: `mongodb+srv://username:password@cluster.mongodb.net/mini_class_scheduler`
6. Add to `.env` as `MONGO_URI`

---

## Monitoring & Troubleshooting

### Check Backend Status
```bash
curl http://localhost:3000
# Should get 404 (normal, no root endpoint defined)
```

### Check Frontend Build
```bash
npm run build
# Should show successful output
```

### View Backend Logs
```bash
# In production with PM2
pm2 logs scheduler

# Or if running directly
npm start
# Watch console output
```

### Common Issues

**Issue: "Cannot connect to MongoDB"**
- Check `MONGO_URI` in `.env`
- Verify MongoDB is running
- Check firewall if using remote MongoDB

**Issue: "Port 3000 already in use"**
- Change PORT in `.env` to available port
- Or kill process: `lsof -i :3000 | kill -9`

**Issue: "CORS error in browser"**
- Check backend CORS configuration
- Verify `VITE_API_BASE_URL` matches backend URL
- Check that backend is actually running

**Issue: "Authentication failing"**
- Verify database has users collection
- Check email normalization (should be lowercase)
- Review password hashing in backend

---

## Performance Optimization

### Frontend Optimization
```bash
# Build with size analysis
npm run build -- --analyze

# Reduce bundle size
npm install -D @vitejs/plugin-react

# Enable gzip compression (on web server)
```

### Backend Optimization
```bash
# Use production mode
NODE_ENV=production npm start

# Enable response caching
# Add to index.js middleware
app.set('etag', false);
app.use(express.static('public', { maxAge: '1h' }));
```

### Database Optimization
```javascript
// Create indexes for common queries
db.users.createIndex({ email: 1 }, { unique: true })
db.slots.createIndex({ start: 1 }, { unique: true })
db.slots.createIndex({ status: 1 })
db.slots.createIndex({ createdBy: 1 })
```

---

## Maintenance

### Regular Backups
```bash
# Weekly MongoDB backup
0 0 * * 0 mongodump --uri "mongodb://..." --out /backups/$(date +%Y%m%d)
```

### Update Dependencies
```bash
cd mini-class-scheduler
npm update

cd ../mini-class-scheduler-server
npm update

# Audit for security vulnerabilities
npm audit fix
```

### Monitor User Growth
```javascript
// Check collection sizes
db.users.countDocuments()
db.slots.countDocuments()

// Check database size
db.stats()
```

---

## Scaling Considerations

For production with high traffic:

1. **Database Scaling**
   - MongoDB Atlas auto-scaling
   - Implement read replicas

2. **Server Scaling**
   - Use load balancer (Nginx)
   - Deploy multiple server instances
   - Use environment-specific configurations

3. **Frontend Caching**
   - CDN for static assets (CloudFront, Cloudflare)
   - Browser caching headers
   - Service workers for offline access

4. **API Rate Limiting**
   - Add rate limiter middleware
   - Throttle requests per user
   - Cache frequent queries

