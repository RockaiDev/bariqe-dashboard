# Pre-Deployment Checklist for Render

## ✅ Code Readiness

- [x] TypeScript compiles successfully
- [x] Build command configured (`npm run build`)
- [x] Start command configured (`npm start`)
- [x] Entry point correct (`dist/app.js`)
- [x] Server binds to `0.0.0.0` and uses `PORT` env variable
- [x] Health check endpoint exists (`/`)

## ✅ Configuration Files

- [x] `render.yaml` - Render Blueprint configuration
- [x] `.renderignore` - Excludes unnecessary files
- [x] `package.json` - All dependencies listed
- [x] `tsconfig.json` - TypeScript configuration
- [x] `.gitignore` - Prevents committing sensitive files

## ⚠️ Environment Variables to Set in Render

Configure these in Render Dashboard before deployment:

### Required
- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `JWT` - JWT secret key (32+ characters)
- [ ] `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` - Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` - Cloudinary API secret
- [ ] `DEV_ORIGIN` - Frontend URL (e.g., https://your-app.vercel.app)

### Optional (if using these services)
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `EMAIL_HOST` - SMTP host
- [ ] `EMAIL_PORT` - SMTP port
- [ ] `EMAIL_USER` - Email username
- [ ] `EMAIL_PASS` - Email password

### Auto-configured
- [x] `NODE_ENV=production` - Set automatically
- [x] `PORT=8080` - Set automatically by Render

## ✅ Database Setup

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write permissions
- [ ] IP whitelist configured (add `0.0.0.0/0` for Render)
- [ ] Connection string tested locally

## ✅ External Services

- [ ] Cloudinary account active
- [ ] Cloudinary upload presets configured (if needed)
- [ ] Stripe account configured (if using payments)
- [ ] Email service configured (if using email notifications)

## ✅ Security

- [x] Password hashing implemented (bcryptjs)
- [x] CORS configured properly
- [x] Helmet security headers enabled
- [x] JWT authentication implemented
- [x] Environment variables not committed to Git
- [ ] Rate limiting configured (consider adding for production)
- [ ] Input validation implemented (Zod)

## ✅ Code Quality

- [x] Error handling implemented
- [x] Logging configured (Morgan)
- [x] API error responses standardized
- [ ] Build succeeds without errors (test with `npm run build`)
- [ ] No TypeScript errors

## 🔄 Deployment Process

1. [ ] Commit and push all changes to GitHub
2. [ ] Create Render account
3. [ ] Connect GitHub repository to Render
4. [ ] Deploy using Blueprint (render.yaml) or manual setup
5. [ ] Configure all environment variables in Render Dashboard
6. [ ] Wait for deployment to complete
7. [ ] Test health check endpoint
8. [ ] Update frontend to use new backend URL
9. [ ] Test all API endpoints
10. [ ] Monitor logs for errors

## 🧪 Post-Deployment Testing

Test these endpoints after deployment:

```bash
# Health check
curl https://your-service.onrender.com/

# Should return: 🚀 API is running..
```

Expected response: Success (200 OK)

Test other critical endpoints:
- [ ] Authentication endpoints (/api/auth/login, /api/auth/register)
- [ ] Protected routes with JWT
- [ ] File upload functionality
- [ ] Database read/write operations
- [ ] CORS from frontend domain

## 📊 Monitoring

After deployment:
- [ ] Check Render logs for errors
- [ ] Monitor response times
- [ ] Verify database connections
- [ ] Test file uploads to Cloudinary
- [ ] Confirm email sending (if configured)

## 🚨 Common Issues & Solutions

### Issue: Build fails
**Solution**: Run `npm run build` locally to identify TypeScript errors

### Issue: Server crashes on startup
**Solution**: Check environment variables are set correctly in Render

### Issue: Database connection fails
**Solution**: 
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check `MONGO_URI` format and credentials

### Issue: CORS errors from frontend
**Solution**: 
- Add frontend URL to allowed origins in `app.ts`
- Update `DEV_ORIGIN` environment variable

### Issue: File upload fails
**Solution**: 
- Verify Cloudinary credentials
- Check Cloudinary upload presets

### Issue: Slow response times
**Solution**: 
- Render free tier spins down after 15 minutes of inactivity
- Consider upgrading to Starter plan ($7/month)

## 📝 Notes

- **Free Tier**: Spins down after 15 minutes of inactivity; first request takes ~30-60s
- **Build Time**: Typically 2-5 minutes
- **Auto-Deploy**: Enabled by default on push to main branch
- **Health Checks**: Render monitors `/` endpoint automatically
- **Logs**: Available in Render Dashboard (last 30 days on free tier)

## ✅ Ready to Deploy?

If all items above are checked, your backend is ready for Render deployment!

Follow the detailed instructions in `RENDER_DEPLOYMENT.md`
