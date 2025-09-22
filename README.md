# SmartTech Client Portal

A comprehensive client portal integrated with ServiceM8 for managing jobs, quotes, and feedback.

## 🚀 Features

- **Dual Portal System**: Admin portal for management + Client portal for end users
- **ServiceM8 Integration**: Real-time sync of jobs, quotes, clients via API + webhooks
- **Authentication**: Magic link login with role-based access (admin vs client)
- **Quote Management**: Clients can view, approve/reject quotes with SM8 sync
- **Feedback System**: Rating system with conditional Google review flow
- **Realtime Updates**: Supabase realtime + push notifications
- **Document Management**: Secure document storage and preview
- **Audit & Logging**: Comprehensive tracking of all actions

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** (App Router, SSR/SSG)
- **TypeScript** - type safety
- **TailwindCSS** - styling & responsive design
- **Zustand** - lightweight state management
- **React Query (TanStack Query)** - server state & API cache
- **Lucide React** - modern, accessible UI icons

### Backend / Services

- **Next.js API Routes** - backend API layer
- **Supabase** - auth, database, real-time updates, storage
- **Zod** - schema validation
- **ServiceM8 API** - external system integration

### Authentication & Security

- **Supabase Auth** (email, magic link, password)
- **Role-based access control** (admin vs client)
- **Audit logs** in DB for admin tracking
- **VAPID keys** – secure web push subscription & delivery

## 📁 Project Structure

```
smarttech_portal/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # Base UI components
│   ├── admin/             # Admin-specific components
│   └── client/            # Client-specific components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── stores/            # Zustand stores
│   ├── supabase/          # Supabase client config
│   ├── utils/             # Utility functions
│   └── validations/        # Zod schemas
├── services/              # API service functions
├── types/                 # TypeScript type definitions
└── docs/                  # Project documentation
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- ServiceM8 account with API access

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd smarttech_portal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp env.template .env.local
   ```

   Fill in your environment variables:
   - Supabase project URL and keys
   - ServiceM8 API credentials
   - VAPID keys for push notifications

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run check-all` - Run all checks (types, lint, format)

## 🎨 Design System

The project uses a custom design system built on TailwindCSS with SmartTech brand colors:

- **Primary**: `#0F6BFF` (blue) - actions, primary CTAs
- **Accent**: `#00B894` (green) - success, approved
- **Warn**: `#FF9F43` (orange) - pending
- **Danger**: `#FF4757` (red) - rejected, errors
- **Surface**: `#F8FAFC` (light) and `#FFFFFF` (white card)
- **Typography**: Inter font family

## 🔧 Development

### Component Development

Components are organized by feature and follow these patterns:

- **UI Components**: Reusable, styled components in `/components/ui/`
- **Feature Components**: Business logic components in `/components/admin/` or `/components/client/`
- **Hooks**: Custom React hooks in `/hooks/`
- **Services**: API and external service integrations in `/services/`

### State Management

- **Zustand** for client-side state management
- **React Query** for server state and caching
- **Supabase Realtime** for live updates

### Type Safety

- **TypeScript** with strict mode enabled
- **Zod** schemas for runtime validation
- **Path aliases** configured for clean imports (`@/`)

## 🚀 Deployment

The application is designed to be deployed on Vercel with the following considerations:

1. **Environment Variables**: All required env vars must be set in Vercel
2. **Database**: Supabase handles database hosting
3. **File Storage**: Supabase Storage for documents
4. **Push Notifications**: VAPID keys configured for web push

## 📚 Documentation

- [SmartTech Client Portal Overview](./docs/SmartTech%20Client%20Portal.md)
- [ServiceM8 Integration Guide](./docs/ServiceM8%20—%20Quick%20Technical%20Reference.md)
- [API Documentation](./docs/API%20Connections%20Hooks%20and%20Services.md)
- [UI/UX Guidelines](./docs/UI%20and%20UX%20for%20SmartTech%20Client%20Portal.md)

## 🤝 Contributing

1. Follow the established code style (Prettier + ESLint)
2. Write TypeScript with proper types
3. Add tests for new features
4. Update documentation as needed

## 📄 License

This project is proprietary to SmartTech.
