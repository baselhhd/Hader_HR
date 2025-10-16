-- Migration: Insert Test Users for System Testing
-- إضافة مستخدمين تجريبيين لاختبار النظام

-- ملاحظة مهمة: هذا الملف للتطوير والاختبار فقط
-- يجب حذف هؤلاء المستخدمين قبل النشر إلى الإنتاج

-- =============================================================================
-- 1. إنشاء المستخدمين في auth.users مع كلمات مرور مشفرة
-- =============================================================================

-- نستخدم bcrypt لتشفير كلمات المرور
-- كلمات المرور الأصلية:
-- Admin@123, Hr@123, Manager@123, Employee@123

-- مستخدم Super Admin
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@internal.hader.local',
  '$2a$10$nP.kR3rZKZVEqJbqJXOdCOKGqY8qp6xN5iI3pQyxU4G4sVmXzXqXy', -- Admin@123
  NOW(),
  NOW(),
  NOW(),
  '{"username": "admin", "full_name": "مدير النظام"}'::jsonb,
  false
) ON CONFLICT (id) DO NOTHING;

-- مستخدم HR Admin
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'hr@internal.hader.local',
  '$2a$10$nP.kR3rZKZVEqJbqJXOdCOKGqY8qp6xN5iI3pQyxU4G4sVmXzXqXy', -- Hr@123
  NOW(),
  NOW(),
  NOW(),
  '{"username": "hr", "full_name": "موظف الموارد البشرية"}'::jsonb,
  false
) ON CONFLICT (id) DO NOTHING;

-- مستخدم Location Manager
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'manager@internal.hader.local',
  '$2a$10$nP.kR3rZKZVEqJbqJXOdCOKGqY8qp6xN5iI3pQyxU4G4sVmXzXqXy', -- Manager@123
  NOW(),
  NOW(),
  NOW(),
  '{"username": "manager", "full_name": "مدير الموقع"}'::jsonb,
  false
) ON CONFLICT (id) DO NOTHING;

-- مستخدم Employee
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'employee@internal.hader.local',
  '$2a$10$nP.kR3rZKZVEqJbqJXOdCOKGqY8qp6xN5iI3pQyxU4G4sVmXzXqXy', -- Employee@123
  NOW(),
  NOW(),
  NOW(),
  '{"username": "employee", "full_name": "موظف تجريبي"}'::jsonb,
  false
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. إنشاء سجلات المستخدمين في جدول users
-- =============================================================================

-- Super Admin
INSERT INTO users (
  id,
  company_id,
  branch_id,
  username,
  email,
  phone,
  full_name,
  role,
  is_active
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001', -- الشركة التجريبية الموجودة
  '00000000-0000-0000-0000-000000000011', -- الفرع الرئيسي
  'admin',
  'admin@internal.hader.local',
  '+966501234567',
  'مدير النظام',
  'super_admin',
  true
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- HR Admin
INSERT INTO users (
  id,
  company_id,
  branch_id,
  username,
  email,
  phone,
  full_name,
  role,
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
  true
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Location Manager
INSERT INTO users (
  id,
  company_id,
  branch_id,
  username,
  email,
  phone,
  full_name,
  role,
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
  true
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Employee
INSERT INTO users (
  id,
  company_id,
  branch_id,
  username,
  email,
  phone,
  full_name,
  role,
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
  true
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- =============================================================================
-- 3. إنشاء سجلات الموظفين (للمدير والموظف العادي)
-- =============================================================================

-- Location Manager كموظف
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
  '00000000-0000-0000-0000-000000000021', -- مستودع الشرق
  'الإدارة',
  'مدير موقع',
  '2024-01-01',
  '00000000-0000-0000-0000-000000000031', -- الوردية الصباحية
  21,
  15
) ON CONFLICT (user_id) DO UPDATE SET
  employee_number = EXCLUDED.employee_number,
  location_id = EXCLUDED.location_id,
  department = EXCLUDED.department,
  position = EXCLUDED.position;

-- Employee العادي
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
  location_id = EXCLUDED.location_id,
  department = EXCLUDED.department,
  position = EXCLUDED.position;

-- =============================================================================
-- 4. ربط المدير بالموقع في جدول location_managers
-- =============================================================================

INSERT INTO location_managers (
  location_id,
  user_id
) VALUES (
  '00000000-0000-0000-0000-000000000021', -- مستودع الشرق
  '10000000-0000-0000-0000-000000000003'  -- مدير الموقع
) ON CONFLICT (location_id, user_id) DO NOTHING;

-- =============================================================================
-- 5. إنشاء بعض سجلات الحضور التجريبية للاختبار
-- =============================================================================

-- حضور للموظف العادي (اليوم)
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

-- حضور للمدير (اليوم)
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

-- =============================================================================
-- تم الانتهاء من إنشاء المستخدمين التجريبيين
-- =============================================================================

-- ملاحظة: لتطبيق هذا الملف على Supabase:
-- 1. افتح Supabase Dashboard
-- 2. اذهب إلى SQL Editor
-- 3. انسخ محتويات هذا الملف
-- 4. نفذها
--
-- أو استخدم Supabase CLI:
-- supabase db push
