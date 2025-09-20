# Database Migration Instructions

## Adding the `cancellation_allowed` Column to Existing Events Table

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **events** table
3. Click **Add Column**
4. Set:
   - Column name: `cancellation_allowed`
   - Type: `boolean`
   - Default value: `true`
   - Is nullable: `false`
5. Click **Save**

### Option 2: Using SQL Editor in Supabase
1. Go to **SQL Editor** in your Supabase dashboard
2. Run the migration script: `migration_add_cancellation_allowed.sql`
3. Execute the script to add the column

### Option 3: Using psql Command Line
If you have direct PostgreSQL access:
```bash
psql -h your-host -U your-username -d your-database -f migration_add_cancellation_allowed.sql
```

### Option 4: Using Supabase CLI
If you have Supabase CLI installed:
```bash
supabase db reset
# This will recreate the database with the updated schema
```

## Verification Steps
After running the migration:

1. **Check the column exists:**
   ```sql
   SELECT column_name, data_type, is_nullable, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'events' AND column_name = 'cancellation_allowed';
   ```

2. **Verify data:**
   ```sql
   SELECT id, title, cancellation_allowed FROM events LIMIT 5;
   ```

3. **Test the application:**
   - Go to student dashboard
   - Check if registration review shows cancel buttons
   - Try cancelling a registration

## Important Notes
- All existing events will have `cancellation_allowed = true` by default
- You can manually update specific events to disable cancellation if needed
- The application code already handles this column, so no code changes are required
- Make sure to backup your database before running migrations
