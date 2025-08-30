# Quick Setup Guide

## 🔧 Database Setup Required

The application is currently running but needs database configuration to work properly.

### Step 1: Create Environment File

Create a file named `.env.local` in the root directory with the following content:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://aranyasen993_db_user:YOUR_ACTUAL_PASSWORD@cluster0.pxdxdkf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Cloudinary Configuration (optional for now)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key_here
NEXTAUTH_URL=http://localhost:3001
```

### Step 2: Get MongoDB Credentials

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up or log in
3. Create a new cluster (free tier is fine)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string
7. Replace `YOUR_ACTUAL_PASSWORD` with your database user password

### Step 3: Restart the Server

After creating the `.env.local` file, restart the development server:

```bash
npm run dev
```

### Step 4: Test the Signup

1. Go to http://localhost:3001/signup
2. Fill in the form
3. Connect your wallet
4. Complete all steps
5. The signup should now work without the "All fields are required" error

## 🚨 Current Issue Fixed

The "All fields are required" error was caused by:
1. Missing database configuration
2. Improper name splitting in the form
3. Missing validation for required fields

These issues have been fixed in the code, but you still need to set up the database connection.

## 📝 Alternative: Use Local MongoDB

If you prefer to use a local MongoDB installation:

1. Install MongoDB locally
2. Use this connection string in `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/crowdfunding
   ```

## 🆘 Need Help?

- Check the browser console for detailed error messages
- See the full SETUP.md file for comprehensive instructions
- The application will show helpful error messages if the database isn't configured
