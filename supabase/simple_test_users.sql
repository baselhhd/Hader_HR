-- Simple Test Users Creation Script
-- نسخة مبسطة لإنشاء مستخدمين تجريبيين مباشرة في جدول users فقط
--
-- ملاحظة: هذا الملف لا يُنشئ مستخدمين في auth.users
-- بدلاً من ذلك، يجب عليك إنشاء المستخدمين يدوياً في Supabase Dashboard
-- ثم تشغيل هذا الملف لتحديث أدوارهم

-- =============================================================================
-- البديل الأسهل: استخدام جدول users مباشرة مع نظام تسجيل دخول مخصص
-- =============================================================================

-- إضافة حقل password مباشرة في جدول users (للتطوير فقط!)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- تحديث/إدخال المستخدمين التجريبيين

-- 1. Super Admin
INSERT INTO users (
  id,
  company_id,
  branch_id,
  username,
  email,
  phone,
  full_name,
  role,
  password,
  is_active
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000011',
  'admin',
  'admin@internal.hader.local',
  '+966501234567',
  'مدير النظام',
  'super_admin',
  'Admin@123',
  true
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- 2. HR Admin
INSERT INTO users (
  id,
  company_id,
  branch_id,
  username,
  email,
  phone,
  full_name,
  role,
  password,
  is_active
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000011',
  'hr',
  'hr@internal.hader.local',
  '+966502345678',
  'موظف الموارد البشرية',
  'hr_admin',
  'Hr@123',
  true
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- 3. Location Manager
INSERT INTO users (
  id,
  company_id,
  branch_id,
  username,
  email,
  phone,
  full_name,
  role,
  password,
  is_active
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000011',
  'manager',
  'manager@internal.hader.local',
  '+966503456789',
  'مدير الموقع',
  'loc_manager',
  'Manager@123',
  true
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- 4. Employee
INSERT INTO users (
  id,
  company_id,
  branch_id,
  username,
  email,
  phone,
  full_name,
  role,
  password,
  is_active
) VALUES (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000011',
  'employee',
  'employee@internal.hader.local',
  '+966504567890',
  'موظف تجريبي',
  'employee',
  'Employee@123',
  true
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- إضافة سجلات الموظفين
INSERT INTO employees (
  user_id,
  employee_number,
  location_id,
  department,
  position,
  hire_date,
  shift_id,
  vacation_balance,
  sick_leave_balance
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  'MGR-001',
  '00000000-0000-0000-0000-000000000021',
  'الإدارة',
  'مدير موقع',
  '2024-01-01',
  '00000000-0000-0000-0000-000000000031',
  21,
  15
) ON CONFLICT (user_id) DO UPDATE SET
  employee_number = EXCLUDED.employee_number,
  location_id = EXCLUDED.location_id;

INSERT INTO employees (
  user_id,
  employee_number,
  location_id,
  department,
  position,
  hire_date,
  shift_id,
  vacation_balance,
  sick_leave_balance
) VALUES (
  '10000000-0000-0000-0000-000000000004',
  'EMP-001',
  '00000000-0000-0000-0000-000000000021',
  'العمليات',
  'موظف تشغيلي',
  '2024-01-15',
  '00000000-0000-0000-0000-000000000031',
  21,
  15
) ON CONFLICT (user_id) DO UPDATE SET
  employee_number = EXCLUDED.employee_number,
  location_id = EXCLUDED.location_id;

-- ربط المدير بالموقع
INSERT INTO location_managers (
  location_id,
  user_id
) VALUES (
  '00000000-0000-0000-0000-000000000021',
  '10000000-0000-0000-0000-000000000003'
) ON CONFLICT (location_id, user_id) DO NOTHING;

-- إضافة سجلات حضور تجريبية
INSERT INTO attendance_records (
  company_id,
  branch_id,
  location_id,
  employee_id,
  shift_id,
  check_in,
  expected_check_in,
  method_used,
  gps_lat,
  gps_lng,
  gps_distance,
  status,
  late_minutes
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000021',
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000031',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours',
  'qr',
  24.7136,
  46.6753,
  45.5,
  'approved',
  0
);

INSERT INTO attendance_records (
  company_id,
  branch_id,
  location_id,
  employee_id,
  shift_id,
  check_in,
  expected_check_in,
  method_used,
  gps_lat,
  gps_lng,
  gps_distance,
  status,
  late_minutes
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000021',
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000031',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours',
  'qr',
  24.7136,
  46.6753,
  30.2,
  'approved',
  0
);

-- تم الانتهاء!
SELECT 'تم إنشاء المستخدمين التجريبيين بنجاح!' as message;
