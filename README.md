# Eventure - Campus Event Management Platform

A modern event management platform built with Next.js, React, and Supabase for Christ University.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 3. Run Development Server
```bash
npm run dev
```

## 🗄️ Database Schema

The application uses the following main tables:

- **users** - User authentication and basic info
- **students** - Student-specific information
- **organizers** - Event organizer information
- **events** - Event details and metadata
- **event_registrations** - Student event registrations
- **venues** - Venue information and availability
- **venue_bookings** - Venue booking requests

## 🔧 Database Connectivity

### Client-Side Components
Use the client-side Supabase client for browser operations:
```typescript
import { createClient } from "@/lib/supabase/client"
```

### Server-Side Components
Use the server-side Supabase client for server operations:
```typescript
import { createClient } from "@/lib/supabase/server"
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── ui/               # UI component library
│   └── venues/           # Venue-related components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   └── supabase/         # Supabase client configurations
└── scripts/              # Database SQL scripts
```

## 🚨 Important Notes

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Database Client**: Use the appropriate client (client vs server) based on context
3. **Error Handling**: All database operations include proper error handling
4. **Type Safety**: Components use TypeScript interfaces for database responses

## 🐛 Troubleshooting

### Common Issues

1. **Missing Environment Variables**: Ensure all required Supabase environment variables are set
2. **Database Connection**: Check if your Supabase project is active and accessible
3. **Table Names**: Verify table names match between your database and code

### Database Connection Test
```typescript
const supabase = createClient()
const { data, error } = await supabase
  .from("events")
  .select("count")
  .limit(1)

if (error) {
  console.error("Database connection failed:", error)
}
```

## 📚 Dependencies

- **Next.js 15.2.4** - React framework
- **React 18.3.1** - UI library
- **Supabase** - Backend and database
- **Tailwind CSS** - Styling
- **Radix UI** - Component primitives
- **TypeScript** - Type safety

## 🔒 Security

- Environment variables for sensitive data
- Server-side validation for all database operations
- Proper authentication middleware
- Role-based access control

## 📝 License

This project is for educational purposes at Christ University.
