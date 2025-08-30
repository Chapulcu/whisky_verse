# SQL Scripts

This directory contains all SQL scripts for database setup, maintenance, and data management for the WhiskyVerse application.

## 📁 File Organization

### Database Setup
- `corrected_database_setup.sql` - Corrected database schema setup
- `test_1_connection.sql` - Test database connection
- `test_2_create_tables.sql` - Test table creation

### Sample Data
- `quick_test_data.sql` - Quick test data for development
- `test_3_sample_data.sql` - Sample data for testing
- `test_4_extended_data.sql` - Extended test dataset
- `import_whiskies_from_csv.sql` - Import whisky data from CSV

### Database Maintenance
- `database_reset_manual.sql` - Manual database reset
- `reset_user_system.sql` - Reset user authentication system
- `fix_empty_lists.sql` - Fix empty list issues

### Security & Row Level Security (RLS)
- `fix_rls_policies.sql` - Fix Row Level Security policies
- `fix_rls_completely.sql` - Complete RLS fixes

## 🚀 Usage

### Running SQL Scripts

Using psql (local development):
```bash
# Connect to local database
psql -h localhost -U postgres -d whiskyverse -f sql-scripts/script-name.sql
```

Using Supabase CLI:
```bash
# Apply to Supabase project
supabase db reset --linked
```

Using Node.js utility:
```bash
# Use the run_sql utility (moved to tests/)
node tests/run_sql.js sql-scripts/script-name.sql
```

### Script Categories

**Setup Scripts** (Run once):
- `corrected_database_setup.sql`
- `test_2_create_tables.sql`

**Test Data Scripts** (Development):
- `quick_test_data.sql`
- `test_3_sample_data.sql`
- `test_4_extended_data.sql`

**Maintenance Scripts** (As needed):
- `fix_rls_policies.sql`
- `fix_rls_completely.sql`
- `fix_empty_lists.sql`

**Reset Scripts** (Destructive - Use with caution):
- `database_reset_manual.sql`
- `reset_user_system.sql`

## ⚠️ Important Safety Notes

### Destructive Scripts
These scripts will **DELETE DATA**:
- `database_reset_manual.sql`
- `reset_user_system.sql`

**Always backup before running:**
```bash
# Backup current database
pg_dump -h your-host -U postgres whiskyverse > backup-$(date +%Y%m%d).sql
```

### Production Usage
- **NEVER** run test or reset scripts on production
- Always test scripts on development environment first
- Review script contents before execution
- Have rollback plan ready

## 🔧 Script Execution Order

For fresh database setup:
1. `corrected_database_setup.sql`
2. `fix_rls_policies.sql`
3. `quick_test_data.sql` (optional, for testing)

For RLS fixes:
1. `fix_rls_policies.sql`
2. `fix_rls_completely.sql`

## 📝 Adding New Scripts

When adding new SQL scripts:
1. Use descriptive filenames
2. Include comments explaining purpose
3. Add safety checks where appropriate
4. Test thoroughly before committing
5. Update this README

### Script Template
```sql
-- Script: script_name.sql
-- Purpose: Brief description of what this script does
-- Safety: DESTRUCTIVE/SAFE
-- Date: YYYY-MM-DD
-- Author: Your name

-- Safety check (for destructive operations)
-- \prompt 'This will DELETE data. Continue? (yes/no): ' confirm
-- \if :confirm != 'yes'
--   \echo 'Operation cancelled.'
--   \quit
-- \endif

-- Your SQL code here
BEGIN;

-- Main operations
-- ...

-- Verify operations
-- ...

COMMIT;
```

## 🔍 Script Verification

After running scripts, verify with:
```sql
-- Check table structure
\d table_name

-- Check data integrity
SELECT COUNT(*) FROM important_table;

-- Check constraints and indexes
\di
\dc
```

## 📊 Monitoring

Track script execution:
```sql
-- Log script execution
INSERT INTO script_execution_log (script_name, executed_at, executed_by) 
VALUES ('script_name.sql', NOW(), current_user);
```