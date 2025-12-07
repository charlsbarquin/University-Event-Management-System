# Deployment Guide for University Event Management System (UEMS) on Render

This guide will walk you through deploying the UEMS application on Render, a cloud platform that supports both web services and static sites.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **MongoDB Atlas**: Set up a free MongoDB Atlas cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
3. **GitHub Repository**: Your code should be pushed to a GitHub repository

## Step 1: Set Up MongoDB Atlas

1. Create a free account on MongoDB Atlas
2. Create a new cluster (free tier is sufficient)
3. Set up database access:
   - Go to "Database Access" → "Add New Database User"
   - Create a user with read/write permissions
4. Configure network access:
   - Go to "Network Access" → "Add IP Address"
   - Add `0.0.0.0/0` to allow access from anywhere
5. Get your connection string:
   - Go to "Clusters" → "Connect" → "Connect your application"
   - Copy the connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/database`)

## Step 2: Deploy Backend (Express.js API)

### 2.1 Create Render Web Service

1. Go to your Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `uems-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `uems-backend`

### 2.2 Configure Environment Variables

In your Render service settings, add these environment variables:

```
NODE_ENV=production
PORT=10000
CLIENT_URL=https://your-frontend-url.onrender.com
SERVER_URL=https://your-backend-url.onrender.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/uems

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4
```

**Important**: Replace the placeholder values with your actual MongoDB connection string and generate a secure JWT secret.

### 2.3 Deploy Backend

1. Click "Create Web Service"
2. Wait for the deployment to complete (this may take several minutes)
3. Once deployed, copy the service URL (e.g., `https://uems-backend.onrender.com`)

## Step 3: Deploy Frontend (React App)

### 3.1 Prepare Frontend for Deployment

First, update your frontend to use the production API URL. Create or update the `.env` file in `uems-frontend/`:

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

**Note**: Replace `your-backend-url.onrender.com` with your actual backend URL from Step 2.

### 3.2 Create Render Static Site

1. Go back to your Render dashboard
2. Click "New +" → "Static Site"
3. Connect your GitHub repository (same repo)
4. Configure the static site:
   - **Name**: `uems-frontend` (or your preferred name)
   - **Build Command**: `cd uems-frontend && npm install && npm run build`
   - **Publish Directory**: `uems-frontend/dist`
   - **Root Directory**: Leave empty (root of repo)

### 3.3 Configure Frontend Environment

In the static site settings, add environment variables:

```
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

### 3.4 Deploy Frontend

1. Click "Create Static Site"
2. Wait for the deployment to complete
3. Once deployed, copy the site URL (e.g., `https://uems-frontend.onrender.com`)

## Step 4: Update Backend CORS Settings

Go back to your backend environment variables and update `CLIENT_URL`:

```
CLIENT_URL=https://your-frontend-url.onrender.com
```

Then redeploy the backend service to apply the changes.

## Step 5: Seed Initial Data (Optional)

If you want to add demo users or initial data:

1. In your backend service, go to "Shell" tab
2. Run: `node scripts/seedDemoUsers.js`

Or create a one-time script in Render to run this.

## Step 6: Verify Deployment

1. Visit your frontend URL
2. Try registering a new user
3. Create an event proposal
4. Check admin dashboard (you may need to manually set a user as admin in the database)

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure `CLIENT_URL` in backend matches your frontend URL exactly
2. **Database Connection**: Verify MongoDB Atlas connection string and network access
3. **File Uploads**: Render's free tier has limitations on file storage. Consider using cloud storage like Cloudinary for production
4. **Build Failures**: Check build logs for missing dependencies or environment variables

### Environment Variables Checklist:

Backend:
- ✅ NODE_ENV=production
- ✅ MONGODB_URI (from Atlas)
- ✅ JWT_SECRET (secure random string)
- ✅ CLIENT_URL (frontend URL)
- ✅ SERVER_URL (backend URL)

Frontend:
- ✅ VITE_API_BASE_URL (backend URL + /api)

### Performance Considerations:

- **Free Tier Limitations**: Render's free tier sleeps after 15 minutes of inactivity
- **Database**: MongoDB Atlas free tier has storage limits
- **File Uploads**: Consider implementing cloud storage for uploaded files

## Cost Optimization

- **Free Tier**: Both web services and static sites have generous free tiers
- **Scaling**: Monitor usage and upgrade plans as needed
- **Database**: MongoDB Atlas free tier is sufficient for development/testing

## Security Notes

- Use strong, unique passwords for database access
- Generate a long, random JWT secret
- Consider enabling HTTPS-only traffic
- Regularly update dependencies for security patches

## Support

If you encounter issues:
1. Check Render deployment logs
2. Verify environment variables
3. Test locally with production environment variables
4. Check MongoDB Atlas connection

Your UEMS application should now be live and accessible at your frontend URL!
