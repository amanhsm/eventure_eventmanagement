# Eventure Database Setup Guide

## Prerequisites
- PostgreSQL database (local or hosted like Supabase)
- Node.js and npm installed

## Database Setup

### 1. Create Database Schema
Run the SQL schema file to create all tables, functions, and triggers:

```sql
-- Execute the complete schema file
\i scripts/eventnest_schema.sql
```

Or copy and paste the contents of `scripts/eventnest_schema.sql` into your PostgreSQL client.

### 2. Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Configuration (if using direct PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/eventure
```

### 3. Test Data
The schema includes sample data for:
- Event categories (technical, cultural, sports, academic, social)
- Sample venues with facilities
- An admin user (username: admin, password: admin123)

### 4. User Authentication
The system uses a custom authentication function `verify_user()` that:
- Validates user credentials against the users table
- Supports different user types (student, organizer, admin)
- Uses bcrypt for password hashing

### 5. Database Features
- **Real-time subscriptions** for live updates
- **Row Level Security** for data protection
- **Audit logging** for all operations
- **Conflict prevention** for venue bookings
- **Automatic triggers** for data consistency

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Access the application at `http://localhost:3000`

## Default Login Credentials

### Admin User
- Username: `admin`
- Password: `admin123`
- Role: `admin`

### Creating Additional Users
Use the database interface or create SQL inserts for the `users` table with corresponding entries in `students`, `organizers`, or `administrators` tables.

## Database Schema Overview

### Core Tables
- `users` - Base user authentication
- `students` - Student profiles
- `organizers` - Event organizer profiles  
- `administrators` - Admin profiles
- `venues` - Event venues with facilities
- `events` - Event details and status
- `event_registrations` - Student event registrations
- `venue_bookings` - Venue reservation system
- `notifications` - System notifications
- `activity_logs` - Audit trail

### Key Features
- UUID primary keys for security
- JSONB fields for flexible data storage
- Exclusion constraints for booking conflicts
- Comprehensive indexing for performance
- Real-time triggers for notifications

## Troubleshooting

### Common Issues
1. **GIST Index Error**: Ensure `btree_gist` extension is enabled
2. **Authentication Failures**: Check password hashing with bcrypt
3. **Real-time Updates**: Verify Supabase real-time is enabled
4. **Venue Conflicts**: Check exclusion constraints are working

### Database Maintenance
- Regular backups recommended
- Monitor activity logs for security
- Clean up old notifications periodically
- Update venue facilities as needed
