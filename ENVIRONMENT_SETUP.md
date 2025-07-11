# Environment Variables Setup

This document provides a comprehensive guide for setting up environment variables for the Cursor Time Tracker application.

## Required Environment Variables

### Database Configuration

```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://username:password@localhost:5432/time_tracker"

# Direct database connection (for Prisma migrations)
DIRECT_URL="postgresql://username:password@localhost:5432/time_tracker"
```

### Clerk Authentication (Required)

To set up Clerk authentication, you need to:

1. **Create a Clerk Account**
   - Go to [clerk.com](https://clerk.com)
   - Create a new application
   - Choose your authentication methods (email/password, Google, GitHub, etc.)

2. **Get Your Clerk Keys**
   - From your Clerk dashboard, go to API Keys
   - Copy the publishable key and secret key

3. **Set Up Environment Variables**
   ```env
   # Clerk Authentication Keys
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-publishable-key-here"
   CLERK_SECRET_KEY="sk_test_your-secret-key-here"
   
   # Clerk Webhook Secret (for user lifecycle events)
   CLERK_WEBHOOK_SECRET="whsec_your-webhook-secret-here"
   ```

4. **Configure Clerk Webhook**
   - In your Clerk dashboard, go to Webhooks
   - Create a new webhook endpoint: `https://yourapp.com/api/webhooks/clerk`
   - Select events: `user.created`, `user.updated`, `user.deleted`
   - Copy the webhook secret to your environment variables

### Application Configuration

```env
# Application URL (used for redirects and webhooks)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Node environment
NODE_ENV="development"
```

## Optional Environment Variables

### Supabase Configuration (Enhanced Features)

If you're using Supabase for enhanced features:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Analytics and Monitoring

```env
# Google Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID="G-XXXXXXXXXX"

# Sentry Error Tracking (optional)
SENTRY_DSN="https://your-sentry-dsn"
```

### Email Service (Future Feature)

```env
# SMTP Configuration for email notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@yourdomain.com"
```

### File Upload Service (Future Feature)

```env
# UploadThing for file uploads
UPLOAD_THING_SECRET="sk_live_your-secret"
UPLOAD_THING_APP_ID="your-app-id"
```

### Feature Flags

```env
# Feature toggles
FEATURE_ANALYTICS_ENABLED="true"
FEATURE_EXPORTS_ENABLED="true"
FEATURE_ACHIEVEMENTS_ENABLED="true"
FEATURE_SOCIAL_AUTH_ENABLED="true"
```

## Setting Up Your Environment

1. **Create your environment file**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your values**
   - Replace all placeholder values with your actual keys
   - Ensure database URLs point to your PostgreSQL instance
   - Add your Clerk keys from the dashboard

3. **Verify your setup**
   ```bash
   # Test database connection
   npx prisma db push
   
   # Start development server
   npm run dev
   ```

## Environment File Security

- **Never commit actual environment files** (`.env`, `.env.local`, etc.)
- **Use different keys for different environments** (dev, staging, production)
- **Rotate keys regularly** for security
- **Use strong, unique webhook secrets**

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check your DATABASE_URL format
   - Ensure PostgreSQL is running
   - Verify credentials and database name

2. **Clerk Authentication Issues**
   - Verify publishable key starts with `pk_`
   - Verify secret key starts with `sk_`
   - Check webhook secret starts with `whsec_`
   - Ensure webhook URL is accessible

3. **Environment Variables Not Loading**
   - Restart your development server
   - Check file is named `.env.local` (not `.env.local.txt`)
   - Verify variables don't have spaces around `=`

### Getting Help

If you encounter issues:
1. Check the Clerk documentation
2. Verify your environment variables are set correctly
3. Check the browser console for errors
4. Review the server logs

## Production Deployment

For production deployment, you'll need to:

1. **Use production Clerk keys**
   - Switch to production application in Clerk
   - Use `pk_live_` and `sk_live_` keys

2. **Set up production database**
   - Use a production PostgreSQL instance
   - Update DATABASE_URL and DIRECT_URL

3. **Configure webhooks**
   - Update webhook URL to production domain
   - Ensure webhook endpoint is accessible

4. **Set environment variables in your hosting platform**
   - Vercel: Project Settings → Environment Variables
   - Heroku: Config Vars
   - Other platforms: Check their documentation 