# Database Setup Guide

This project supports both **Supabase** (cloud) and **local PostgreSQL** options. Choose the setup that works best for your needs.

## Option 1: Local PostgreSQL (Recommended for Development)

### Prerequisites
- PostgreSQL installed locally
- Node.js and npm/yarn

### Setup Steps

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download installer from https://www.postgresql.org/download/
   ```

2. **Create Database**:
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # Create database and user
   CREATE DATABASE time_tracker;;
   CREATE USER myuser WITH PASSWORD 'mypassword';
   GRANT ALL PRIVILEGES ON DATABASE time_tracker; TO myuser;
   \q
   ```

3. **Configure Environment Variables**:
   Update `.env.local`:
   ```env
   # Local PostgreSQL
   DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/time_tracker;"
   
   # Comment out or remove Supabase variables
   # NEXT_PUBLIC_SUPABASE_URL="..."
   # NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
   ```

4. **Run Database Commands**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed with demo data
   npx prisma db seed
   
   # Optional: Open Prisma Studio
   npx prisma studio
   ```

## Option 2: Supabase (Recommended for Production)

### Prerequisites
- Supabase account (free tier available)

### Setup Steps

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Wait for setup to complete

2. **Get Database Credentials**:
   - Go to Project Settings > Database
   - Find connection string under "Connection string"
   - Go to Project Settings > API
   - Copy Project URL and anon public key

3. **Configure Environment Variables**:
   Update `.env.local`:
   ```env
   # Supabase
   DATABASE_URL="postgresql://postgres.your-ref:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
   DIRECT_URL="postgresql://postgres.your-ref:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
   
   # Supabase API (optional, for file storage/real-time)
   NEXT_PUBLIC_SUPABASE_URL="https://your-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```

4. **Run Database Commands**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed with demo data
   npx prisma db seed
   ```

## Option 3: Docker PostgreSQL (Alternative for Development)

### Setup Steps

1. **Create Docker Compose File**:
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     db:
       image: postgres:15
       environment:
         POSTGRES_DB: time_tracker;
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: password
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

2. **Start Database**:
   ```bash
   docker-compose up -d
   ```

3. **Configure Environment Variables**:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/time_tracker;"
   ```

## Feature Comparison

| Feature | Local PostgreSQL | Supabase | Docker PostgreSQL |
|---------|------------------|----------|-------------------|
| Development Speed | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Production Ready | ⭐⭐ | ⭐⭐⭐ | ⭐ |
| File Storage | ❌ | ✅ | ❌ |
| Real-time Updates | ❌ | ✅ | ❌ |
| Cost | Free | Free tier + paid | Free |
| Setup Complexity | Medium | Easy | Easy |

## Available Database Scripts

```bash
# Generate Prisma client types
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Seed database with demo data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Troubleshooting

### Connection Issues
- **Local PostgreSQL**: Check if PostgreSQL service is running
- **Supabase**: Verify credentials and internet connection
- **Docker**: Ensure Docker is running and container is up

### Permission Errors
- Make sure database user has proper permissions
- For local setup, check PostgreSQL user roles

### Schema Sync Issues
- Run `npx prisma db push` to sync schema
- Use `npx prisma migrate reset` to reset database (development only)

## Environment Variables Reference

```env
# Database (choose one)
DATABASE_URL="postgresql://..."           # Required
DIRECT_URL="postgresql://..."             # Optional, for Supabase pooling

# Supabase (optional, for enhanced features)
NEXT_PUBLIC_SUPABASE_URL="https://..."    # For file storage/real-time
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."       # Public API key
SUPABASE_SERVICE_ROLE_KEY="..."           # Server-side operations

# Clerk Authentication (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
# ... other Clerk vars

# Environment
NODE_ENV="development"
```

## Next Steps

Once your database is set up:
1. Verify connection with `npm run db:studio`
2. Check that demo data was seeded properly
3. Continue with Step 4: Database Access Layer and Server Actions

Choose the option that best fits your development workflow and production needs!
