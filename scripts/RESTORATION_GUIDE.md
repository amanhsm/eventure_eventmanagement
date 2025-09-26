# 🚨 DATABASE RESTORATION GUIDE

## EMERGENCY RESTORATION STEPS

### Step 1: Run Main Database Restoration
```sql
-- Run this script first in your Supabase SQL editor:
-- File: RESTORE_DATABASE_COMPLETE.sql
```
This will recreate:
- ✅ All tables (users, students, organizers, administrators, events, venues, etc.)
- ✅ Default data (categories, blocks, sample venues)
- ✅ Sample users and profiles
- ✅ Database indexes

### Step 2: Run RLS Policies (Optional)
```sql
-- Run this script second in your Supabase SQL editor:
-- File: RESTORE_RLS_POLICIES.sql
```
This will recreate:
- ✅ Row Level Security policies
- ✅ Access control for different user types

### Step 3: Update User Passwords
The sample users have placeholder password hashes. You'll need to:

1. **For existing users**: Reset their passwords through your auth system
2. **For new users**: Create proper accounts through your registration system

### Step 4: Verify Restoration
Run this query to check if everything is working:

```sql
-- Check table counts
SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM organizers) as organizers,
    (SELECT COUNT(*) FROM students) as students,
    (SELECT COUNT(*) FROM venues) as venues,
    (SELECT COUNT(*) FROM event_categories) as categories,
    (SELECT COUNT(*) FROM blocks) as blocks;

-- Check if your organizer record exists
SELECT 
    u.id as user_id,
    u.usernumber,
    u.email,
    o.id as organizer_id,
    o.name as organizer_name
FROM users u
JOIN organizers o ON u.id = o.user_id
WHERE u.usernumber = 'ORG001';  -- Replace with your username
```

### Step 5: Test Your Application
1. ✅ Try logging in as organizer
2. ✅ Try creating an event
3. ✅ Check if admin dashboard works
4. ✅ Test student registration (if applicable)

## 🔧 TROUBLESHOOTING

### If you get "organizer not found" errors:
```sql
-- Create your organizer record manually
INSERT INTO organizers (user_id, name, department, organization)
VALUES 
    (YOUR_USER_ID, 'Your Name', 'Your Department', 'Your Organization');
```

### If you get RLS policy errors:
```sql
-- Temporarily disable RLS for testing
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizers DISABLE ROW LEVEL SECURITY;
-- Re-enable after fixing
```

### If venues are missing:
```sql
-- Check if venues were created
SELECT v.venue_name, b.block_name 
FROM venues v 
JOIN blocks b ON v.block_id = b.id;
```

## 📋 WHAT WAS RESTORED

### Core Tables:
- `users` - Authentication and user management
- `students` - Student profiles
- `organizers` - Organizer profiles  
- `administrators` - Admin profiles
- `events` - Event management
- `event_registrations` - Student registrations
- `event_categories` - Event categories
- `venues` - Venue management
- `blocks` - Building blocks
- `event_attendance` - Attendance tracking

### Default Data:
- 5 Event categories (technical, cultural, sports, academic, other)
- 10 Building blocks (Block A through J)
- 15 Sample venues across different blocks
- Sample users (admin, organizers, students)

### Security:
- Row Level Security policies
- Proper access control for different user types
- Database indexes for performance

## ⚠️ IMPORTANT NOTES

1. **Passwords**: All sample users have placeholder passwords - update them!
2. **User IDs**: Your actual user ID might be different - check and update organizer records
3. **Backups**: Set up regular backups to prevent this in the future
4. **Testing**: Test thoroughly before going live

## 🆘 IF SOMETHING GOES WRONG

1. **Check Supabase logs** for specific error messages
2. **Run the diagnostic scripts** we created earlier
3. **Contact me** with specific error messages
4. **Don't panic** - we can fix any issues that come up!

---
*This restoration should get your database back to a working state. Let me know if you encounter any issues!*
