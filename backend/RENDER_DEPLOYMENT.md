# Render Deployment Guide for Bariqe Dashboard Backend

## Prerequisites
- [Render Account](https://render.com) (free tier available)
- MongoDB Atlas database
- Cloudinary account
- Stripe account (if using payments)

## Deployment Steps

### Option 1: Deploy with Blueprint (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add Render configuration"
   git push origin main
   ```

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the `backend` directory
   - Render will automatically detect the `render.yaml` file

3. **Configure Environment Variables**
   
   After deployment starts, go to the service and set these environment variables:
   
   | Variable | Example | Required |
   |----------|---------|----------|
   | `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/db` | ✅ Yes |
   | `JWT` | Any secure random string (32+ chars) | ✅ Yes |
   | `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | ✅ Yes |
   | `CLOUDINARY_API_KEY` | Your Cloudinary API key | ✅ Yes |
   | `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | ✅ Yes |
   | `DEV_ORIGIN` | `https://your-frontend.vercel.app` | ✅ Yes |
   | `STRIPE_SECRET_KEY` | Your Stripe secret key | ⚠️ If using Stripe |
   | `EMAIL_HOST` | Your email SMTP host | ⚠️ If using email |
   | `EMAIL_PORT` | SMTP port (usually 587) | ⚠️ If using email |
   | `EMAIL_USER` | Your email address | ⚠️ If using email |
   | `EMAIL_PASS` | Your email password | ⚠️ If using email |

4. **Update Frontend URL**
   - After deployment, update the `DEV_ORIGIN` variable with your actual frontend URL
   - Also update the CORS configuration in `app.ts` if needed

### Option 2: Manual Deployment

1. **Go to Render Dashboard**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory

2. **Configure Service**
   - **Name**: `bariqe-dashboard-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your preferred plan)

3. **Add Environment Variables**
   - Go to "Environment" tab
   - Add all required variables listed above

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

## Post-Deployment

### 1. MongoDB Atlas IP Whitelist
Add Render's IP addresses to MongoDB Atlas:
- Go to MongoDB Atlas → Network Access
- Add IP Address: `0.0.0.0/0` (allows all IPs - for development)
- For production, use Render's specific IPs

### 2. Test Health Check
Visit your Render URL (e.g., `https://bariqe-dashboard-backend.onrender.com`)
You should see: "🚀 API is running.."

### 3. Update Frontend
Update your frontend's API base URL to point to your new Render URL.

### 4. Test API Endpoints
```bash
# Test health check
curl https://your-service.onrender.com/

# Test with authentication
curl -X POST https://your-service.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Important Notes

### Free Tier Limitations
- Render's free tier spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds to wake up
- Consider upgrading to Starter plan ($7/month) for production

### Environment Variables
- Never commit `.env` files to Git
- Use Render's environment variable dashboard
- For sensitive values, use Render's "Secret File" feature

### CORS Configuration
Your app is already configured for production CORS. The allowed origins include:
- Local development (`http://localhost:3000`, `http://localhost:5173`)
- Railway deployments
- Vercel deployments (via regex)

Update `app.ts` lines 29-45 if you need to add specific production URLs.

### File Uploads
- The app uses Cloudinary for file storage (recommended for Render)
- If you need local file storage, uncomment the disk section in `render.yaml`

### Database Seeding
After deployment, you can run seed scripts:
```bash
# SSH into your Render service (Starter plan or higher)
npm run seed
npm run create-admin
```

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compiles locally with `npm run build`

### Database Connection Fails
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check `MONGO_URI` format is correct
- Ensure database user has read/write permissions

### Server Crashes
- Check Render logs for error messages
- Verify all required environment variables are set
- Check MongoDB connection string is valid

### CORS Errors
- Update allowed origins in `app.ts`
- Add your frontend URL to the CORS whitelist
- Ensure credentials are properly configured

## Monitoring

### Render Dashboard
- View real-time logs
- Monitor CPU and memory usage
- Track deployment history

### Health Checks
Render will automatically monitor your `/` endpoint

### Logs
```bash
# View logs via Render CLI
render logs --service bariqe-dashboard-backend --tail
```

## Updating Your App

Render auto-deploys on every push to your connected branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

## Scaling Considerations

For production use:
1. Upgrade to Starter plan or higher
2. Add custom domain
3. Enable auto-scaling if needed
4. Set up proper monitoring and alerts
5. Configure backup strategies for MongoDB

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [MongoDB Atlas Support](https://www.mongodb.com/cloud/atlas/support)
