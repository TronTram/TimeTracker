# Cursor Time Tracker

A focused time tracking application with Pomodoro technique support, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🍅 **Pomodoro Timer**: Customizable work and break intervals
- 📊 **Analytics Dashboard**: Detailed insights into your productivity
- 🎯 **Project Management**: Organize your work with projects and tags
- 🏆 **Achievements System**: Gamified experience to keep you motivated
- 🔐 **Authentication**: Secure user accounts with Clerk
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🌙 **Dark Mode**: Eye-friendly dark theme support
- 🔔 **Notifications**: Browser notifications for session transitions
- 🎵 **Ambient Sounds**: Focus-enhancing background sounds
- 📈 **Data Export**: Export your data in multiple formats

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3.4+
- **Database**: PostgreSQL with Prisma ORM
- **Backend**: Supabase (optional) or local PostgreSQL
- **Authentication**: Clerk
- **State Management**: Zustand
- **Animations**: Framer Motion
- **UI Components**: Radix UI + Custom components
- **Charts**: Recharts
- **Form Handling**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Database: Choose one:
  - Local PostgreSQL installation, OR
  - Supabase account (free tier available), OR
  - Docker (for containerized PostgreSQL)
- Clerk account for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cursor-time-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   - Database URL (PostgreSQL/Supabase)
   - Clerk authentication keys
   - Supabase keys (optional, for enhanced features)
   - Other configuration values

4. **Set up the database**
   
   **Choose one of these options:**
   
   **Option A: Local PostgreSQL (Recommended for development)**
   ```bash
   # Make sure PostgreSQL is running locally
   createdb cursor_time_tracker
   npx prisma db push
   npx prisma db seed
   ```
   
   **Option B: Supabase (Recommended for production)**
   ```bash
   # Create Supabase project and get DATABASE_URL
   npx prisma db push
   npx prisma db seed
   ```
   
   **Option C: Docker PostgreSQL**
   ```bash
   docker-compose up -d  # Start PostgreSQL container
   npx prisma db push
   npx prisma db seed
   ```
   
   📖 **Detailed setup guide**: See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for complete instructions.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
cursor-time-tracker/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   │   ├── features/          # Feature-specific components
│   │   ├── shared/            # Shared components
│   │   └── ui/                # Base UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions and configurations
│   ├── services/              # Business logic and external services
│   ├── stores/                # Zustand state stores
│   ├── types/                 # TypeScript type definitions
│   └── actions/               # Server actions
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── docs/                      # Documentation
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
CLERK_WEBHOOK_SECRET="..."

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing code style (Prettier + ESLint)
- Write tests for new features
- Update documentation as needed
- Ensure all CI checks pass

## Architecture Decisions

### State Management
- **Zustand** for client-side state (timer, UI state)
- **Server Actions** for data mutations
- **React Query** (via Next.js) for server state caching

### Authentication
- **Clerk** for user authentication and management
- **Middleware** for route protection
- **Webhooks** for user lifecycle events

### Database
- **Prisma** as ORM for type-safe database access
- **PostgreSQL** for robust data storage
- **Supabase** for managed database and real-time features

### UI/UX
- **Tailwind CSS** for styling with custom design system
- **Radix UI** for accessible component primitives
- **Framer Motion** for smooth animations
- **Responsive design** with mobile-first approach

## Performance Considerations

- **Server Components** by default for better performance
- **Dynamic imports** for code splitting
- **Image optimization** with Next.js Image component
- **Database indexing** for efficient queries
- **Caching strategies** for frequently accessed data

## Security

- **Input validation** with Zod schemas
- **SQL injection prevention** with Prisma
- **XSS protection** with proper data sanitization
- **CSRF protection** with server actions
- **Rate limiting** on API endpoints
- **Security headers** configured in Next.js

## Deployment

The application is optimized for deployment on Vercel:

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

For other platforms, build the application:

```bash
npm run build
npm start
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or open an issue on GitHub.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] Advanced analytics and reporting
- [ ] Integration with calendar applications
- [ ] API for third-party integrations
- [ ] Advanced gamification features

---

Built with ❤️ using Next.js and TypeScript
