-- Create Super Admin User
-- نفّذ هذا في Supabase SQL Editor

-- Step 1: First, create the user in Supabase Authentication dashboard manually:
-- Email: admin@internal.hader.local
-- Password: Admin123!
-- Then copy the user ID and replace USER_ID_HERE below

-- Step 2: Insert into users table (replace USER_ID_HERE with actual ID from Auth)
-- INSERT INTO users (id, username, full_name, email, phone, role)
-- VALUES ('USER_ID_HERE', 'admin', 'المدير العام', null, null, 'super_admin');

-- Alternative: Update existing user to super_admin
-- If you want to make one of existing users a super admin:

-- Option 1: Make fatima_hr a super admin
UPDATE users
SET role = 'super_admin', full_name = 'فاطمة - المدير العام'
WHERE username = 'fatima_hr';

-- To revert back to hr_admin:
-- UPDATE users SET role = 'hr_admin' WHERE username = 'fatima_hr';
