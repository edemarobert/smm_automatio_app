# SMM Backend API

Social Media Management Backend built with Node.js, Express, and MongoDB.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Create `.env` file** (copy from `.env.example`):
```bash
cp .env.example .env
```

3. **Configure environment variables** in `.env`:
   - Set `MONGODB_URI` (local or Atlas)
   - Set `JWT_SECRET`
   - Set `CORS_ORIGIN`

4. **Start MongoDB** (if using local):
```bash
# Windows
mongod
```

5. **Run the server:**
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/publish` - Publish post

### Accounts
- `POST /api/accounts` - Connect social account
- `GET /api/accounts` - Get connected accounts
- `GET /api/accounts/:id` - Get single account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Disconnect account

### Analytics
- `GET /api/analytics/dashboard/stats` - Dashboard statistics
- `GET /api/analytics/period` - Analytics for period
- `GET /api/analytics/top-posts` - Top performing posts
- `GET /api/analytics/platform-stats` - Platform statistics

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/change-password` - Change password

## Database Models

### User
- fullName, email, password
- company, profileImage
- Notification preferences
- Timestamps

### Post
- userId, content, platforms
- images, status (draft/scheduled/published/failed)
- scheduledFor, publishedAt
- metrics (likes, comments, shares, etc.)
- Timestamps

### Account
- userId, platform, accountName, accountHandle
- accessToken, refreshToken
- followers, isConnected
- Timestamps

### Analytics
- userId, platform, date
- metrics (followers, impressions, engagement, etc.)
- postPerformance data
- Timestamps

## Future Enhancements

- [ ] Social media API integration (Instagram, Twitter, Facebook, LinkedIn)
- [ ] Real-time post scheduling with cron jobs
- [ ] WebSocket for live notifications
- [ ] File uploads for images/videos
- [ ] Team collaboration features
- [ ] Advanced filtering and search
- [ ] Email notifications
- [ ] API rate limiting
