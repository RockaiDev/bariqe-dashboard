# 🚀 AlexChem Dashboard - Vercel Deployment Guide

This guide will help you deploy your AlexChem dashboard to Vercel with optimal configuration.

## 📋 Prerequisites

- [Vercel account](https://vercel.com)
- [GitHub repository](https://github.com) (recommended)
- MongoDB Atlas database
- Cloudinary account (for file uploads)

## 🏗️ Project Structure

```
AlexChem-Dashboard/
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express backend
├── vercel.json        # Root Vercel configuration
└── .env.example       # Environment variables template
```

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

### Step 2: Deploy Backend to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the backend deployment**:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

5. **Set Environment Variables** (in Vercel dashboard):
   ```
   MONGO_URI=mongodb+srv://rockaidev_db_user:X8AmUvT2mal1WOCV@cluster0.tl70axw.mongodb.net/alexchem
   NODE_ENV=production
   DEV_ORIGIN=https://your-frontend-domain.vercel.app
   JWT=your-super-secret-jwt-key-change-this-in-production
   CLOUDINARY_CLOUD_NAME=db152mwtg
   CLOUDINARY_API_KEY=117365712644532
   CLOUDINARY_API_SECRET=WcR1u-IjH-IIzGyDe1aPL5ssoPQ
   ```

6. **Deploy the backend**

### Step 3: Deploy Frontend to Vercel

1. **Create another project in Vercel**
2. **Import the same GitHub repository**
3. **Configure the frontend deployment**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Set Environment Variables**:
   ```
   VITE_API_BASE_URL=https://your-backend-domain.vercel.app
   VITE_APP_TITLE=AlexChem Dashboard
   VITE_APP_VERSION=1.0.0
   ```

5. **Deploy the frontend**

### Step 4: Update CORS Configuration

After both deployments are complete:

1. **Copy the frontend URL** from Vercel
2. **Update the backend environment variable**:
   - Go to backend project settings in Vercel
   - Update `DEV_ORIGIN` to your frontend URL
   - Redeploy the backend

## 🔧 Alternative: Monorepo Deployment

If you prefer a single deployment:

1. **Use the root `vercel.json` configuration**
2. **Deploy from the root directory**
3. **Set all environment variables in one project**

## 📝 Environment Variables Reference

### Backend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `NODE_ENV` | Environment mode | `production` |
| `DEV_ORIGIN` | Frontend URL for CORS | `https://app.vercel.app` |
| `JWT` | JWT secret key | `your-secret-key` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your-api-key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-api-secret` |

### Frontend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://api.vercel.app` |
| `VITE_APP_TITLE` | Application title | `AlexChem Dashboard` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Ensure `DEV_ORIGIN` points to your frontend URL
   - Check that both frontend and backend are deployed

2. **Build Failures**:
   - Check Node.js version compatibility
   - Ensure all dependencies are in `package.json`

3. **Environment Variables**:
   - Verify all required variables are set
   - Check variable names match exactly

4. **Database Connection**:
   - Ensure MongoDB Atlas allows connections from Vercel IPs
   - Check connection string format

## 🎯 Production Checklist

- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] Database connection working
- [ ] Admin user can login
- [ ] File uploads working (Cloudinary)
- [ ] All API endpoints responding

## 🔄 Continuous Deployment

Once set up, Vercel will automatically deploy when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API endpoints manually
4. Check browser console for errors

---

**Happy Deploying! 🚀**
