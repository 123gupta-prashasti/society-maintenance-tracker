# 🚀 Production Deployment Guide

This guide describes how to deploy the **Society Maintenance Tracker** application to production with a separate frontend and backend split architecture:
- **Frontend**: Hosted on **Vercel** (optimized static application hosting)
- **Backend API**: Hosted on **Render** (Node.js/Express web service with persistent Atlas database connection)

---

## 🛠 Prerequisites & Requirements

Before starting, ensure you have:
1. A **GitHub Repository** containing this codebase.
2. A **MongoDB Atlas** database cluster (free tier works perfectly).
3. A **Cloudinary** account (for safe image uploads/attachments).
4. An SMTP email provider or credentials (e.g. Resend, SendGrid, Mailtrap, or Gmail) for sending maintenance updates.

---

## 1. Backend Deployment: Render (Web Service)

Render will build and run the Node.js/Express API server.

### Step-by-Step Setup:
1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New** ➡️ **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Name**: `society-maintenance-api` (or custom name)
   - **Region**: Choose the region closest to your users.
   - **Branch**: `main` (or your active development branch)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build:backend`
   - **Start Command**: `npm start`
   - **Instance Type**: Select the **Free** tier (or higher if needed).

5. Expand the **Advanced** section to add your production **Environment Variables**:

| Variable Name | Description | Recommended Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Run in production mode | `production` |
| `MONGODB_URI` | Your production MongoDB Atlas Connection String | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing authorization tokens | Generate a random 32-character string |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `GEMINI_API_KEY` | Optional key for automated email summary analysis | Your Google Gemini API Key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary name for image hosting | From your Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | From your Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET`| Cloudinary API Secret | From your Cloudinary Dashboard |
| `SMTP_HOST` | Outbound email server | e.g., `smtp.resend.com` or `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port number | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | SMTP username | From your email provider |
| `SMTP_PASS` | SMTP password / API token | From your email provider |
| `SMTP_FROM` | Verified sender address | e.g., `notifications@yourdomain.com` |

6. Click **Create Web Service**. Render will start compiling your backend, connect to Atlas, and boot up on port `3000` (Render binds automatically).
7. Copy your deployed Render URL (e.g., `https://society-maintenance-api.onrender.com`). You will need this for the Vercel frontend config!

---

## 2. Frontend Deployment: Vercel (Static Web App)

Vercel will compile and serve your React/Vite user interface.

### Step-by-Step Setup:
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** ➡️ **Project**.
3. Import your GitHub repository.
4. On the configuration screen:
   - **Framework Preset**: **Vite**
   - **Root Directory**: `./` (Root)
5. Expand the **Build and Development Settings** section and customize:
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `dist`
6. Expand **Environment Variables** and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend.onrender.com` | **Crucial:** Paste the Render Web Service URL you copied in the previous step (make sure there is no trailing slash!). |

7. Click **Deploy**. Vercel will build the frontend and deploy it globally.
8. Once completed, your application is live! Open the provided Vercel domain to test login, LODGE complaints, and manage notices.

---

## 🔒 Security Best Practices Implemented

This project includes high-grade security features out of the box:
- **Helmet**: Secures response HTTP headers to mitigate cross-site scripting (XSS) and clickjacking.
- **CORS**: Handles cross-origin requests securely between the Vercel frontend and the Render backend.
- **Express Rate Limiter**: Limits requests from individual IPs (max 200 per 15 mins for general APIs, max 30 per 15 mins for sensitive login/register routes) to protect against brute-force and DDoS.
- **Express Validator**: Sanitizes HTML tags out of text strings to avoid malicious payloads and runs schema validations at the API router level.
- **Centralized Error Handler**: Suppresses raw database exception stacks in production to prevent information disclosure.
- **Trust Proxy Configuration**: Accurately tracks user IPs through Render's load balancers without producing proxy header validation warnings.

---

## 🛠 Troubleshooting & Tips

### 1. Render web service is sleeping (cold start)
Render's **Free Tier** spins down services after 15 minutes of inactivity. When you open the Vercel app after a while, the first request might take 30–50 seconds to complete while Render wakes up. For production setups, upgrading Render's instance type prevents sleeping.

### 2. "Database Connection Failure" message
- Ensure your MongoDB Atlas IP Access List is set to **allow access from anywhere** (`0.0.0.0/0`) because Render's free IPs are dynamic and change on restarts.
- Double-check that `MONGODB_URI` does not contain spaces or incorrect credentials.

### 3. Images not uploading
Make sure your Cloudinary environment variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`) are correctly defined in your Render settings.
