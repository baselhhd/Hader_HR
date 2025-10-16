-- ============================================
-- سكربت تصفير وإعادة تعبئة قاعدة البيانات
-- Hader HR System - Reset & Seed Script
-- ============================================

-- ============================================
-- الجزء الأول: حذف جميع البيانات (بالترتيب الصحيح)
-- ============================================

-- 1. حذف الجداول التابعة (Child Tables) أولاً
TRUNCATE TABLE verification_requests CASCADE;
TRUNCATE TABLE attendance_records CASCADE;
TRUNCATE TABLE leave_requests CASCADE;
TRUNCATE TABLE custom_requests CASCADE;
TRUNCATE TABLE qr_codes CASCADE;
TRUNCATE TABLE color_codes CASCADE;
TRUNCATE TABLE numeric_codes CASCADE;
TRUNCATE TABLE verification_codes CASCADE;

-- 2. حذف جدول الموظفين والمدراء
TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE location_managers CASCADE;

-- 3. حذف المستخدمين (سيحذف تلقائياً من auth.users بسبب CASCADE)
TRUNCATE TABLE users CASCADE;

-- 4. حذف الورديات
TRUNCATE TABLE shifts CASCADE;

-- 5. حذف المواقع
TRUNCATE TABLE locations CASCADE;

-- 6. حذف الفروع
TRUNCATE TABLE branches CASCADE;

-- 7. حذف الشركات (آخر جدول)
TRUNCATE TABLE companies CASCADE;

-- حذف المستخدمين من auth.users (Supabase Auth)
-- ملاحظة: هذا سيحذف جميع المستخدمين من نظام المصادقة
DELETE FROM auth.users;


-- ============================================
-- الجزء الثاني: إعادة تعبئة البيانات الأساسية
-- ============================================

-- ============================================
-- 1. إضافة الشركة
-- ============================================
INSERT INTO companies (id, name, logo_url, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'شركة حاضر للحضور الذكي', NULL, true);

-- ============================================
-- 2. إضافة الفروع
-- ============================================
INSERT INTO branches (id, company_id, name, address, is_active) VALUES
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'الفرع الرئيسي', 'الرياض - حي الملك فهد', true),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'فرع جدة', 'جدة - حي الزهراء', true);

-- ============================================
-- 3. إضافة المواقع
-- ============================================
INSERT INTO locations (id, company_id, branch_id, name, address, lat, lng, gps_radius, is_active) VALUES
-- مواقع الفرع الرئيسي
('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'مستودع الشرق', 'الرياض - طريق الدمام', 24.713600, 46.675300, 100, true),
('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'المكتب الإداري', 'الرياض - طريق الملك فهد', 24.774265, 46.738586, 50, true),

-- مواقع فرع جدة
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'مستودع جدة الرئيسي', 'جدة - طريق مكة القديم', 21.543333, 39.172779, 150, true);

-- ============================================
-- 4. إضافة الورديات
-- ============================================
INSERT INTO shifts (id, location_id, name, start_time, end_time, break_start, break_duration, work_hours, is_active) VALUES
-- ورديات مستودع الشرق
('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'الوردية الصباحية', '08:00:00', '17:00:00', '12:00:00', 60, 8.00, true),
('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333331', 'الوردية المسائية', '17:00:00', '02:00:00', '21:00:00', 60, 8.00, true),

-- ورديات المكتب الإداري
('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333332', 'الدوام الرسمي', '09:00:00', '18:00:00', '13:00:00', 60, 8.00, true),

-- ورديات مستودع جدة
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'الوردية الصباحية', '08:00:00', '17:00:00', '12:00:00', 60, 8.00, true);

-- ============================================
-- 5. إضافة المستخدمين
-- ============================================

-- ملاحظة مهمة: يجب إضافة المستخدمين في auth.users أولاً
-- ثم سيتم إضافتهم تلقائياً في جدول users عبر Trigger
-- لكن هنا سنضيفهم يدوياً للبساطة

-- 5.1 المدير العام (Super Admin)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '55555555-5555-5555-5555-555555555551',
  'admin@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "admin", "full_name": "المدير العام", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active) VALUES
('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', NULL, 'admin', 'admin@hader.local', '+966501234567', 'المدير العام', 'super_admin', true);

-- 5.2 مدير الموارد البشرية (HR Admin)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '55555555-5555-5555-5555-555555555552',
  'hr@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "hr1", "full_name": "سارة أحمد", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active) VALUES
('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'hr1', 'hr@hader.local', '+966502345678', 'سارة أحمد - مدير الموارد البشرية', 'hr_admin', true);

-- 5.3 مدير موقع (Location Manager)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '55555555-5555-5555-5555-555555555553',
  'manager@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "manager1", "full_name": "خالد محمد", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active) VALUES
('55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'manager1', 'manager@hader.local', '+966503456789', 'خالد محمد - مدير المستودع', 'loc_manager', true);

-- ربط مدير الموقع بالمستودع
INSERT INTO location_managers (location_id, user_id) VALUES
('33333333-3333-3333-3333-333333333331', '55555555-5555-5555-5555-555555555553');

-- 5.4 موظفين (Employees)
-- موظف 1: أحمد علي
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '55555555-5555-5555-5555-555555555561',
  'ahmad@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "ahmad", "full_name": "أحمد علي", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active) VALUES
('55555555-5555-5555-5555-555555555561', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'ahmad', 'ahmad@hader.local', '+966511111111', 'أحمد علي', 'employee', true);

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance) VALUES
('55555555-5555-5555-5555-555555555561', 'EMP001', '33333333-3333-3333-3333-333333333331', 'المستودعات', 'عامل مستودع', '2024-01-15', '44444444-4444-4444-4444-444444444441', 21, 15);

-- موظف 2: فاطمة محمد
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '55555555-5555-5555-5555-555555555562',
  'fatima@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "fatima", "full_name": "فاطمة محمد", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active) VALUES
('55555555-5555-5555-5555-555555555562', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'fatima', 'fatima@hader.local', '+966522222222', 'فاطمة محمد', 'employee', true);

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance) VALUES
('55555555-5555-5555-5555-555555555562', 'EMP002', '33333333-3333-3333-3333-333333333332', 'الإدارة', 'محاسبة', '2024-03-01', '44444444-4444-4444-4444-444444444443', 18, 15);

-- موظف 3: محمد سعيد
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '55555555-5555-5555-5555-555555555563',
  'mohammed@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "mohammed", "full_name": "محمد سعيد", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active) VALUES
('55555555-5555-5555-5555-555555555563', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'mohammed', 'mohammed@hader.local', '+966533333333', 'محمد سعيد', 'employee', true);

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance) VALUES
('55555555-5555-5555-5555-555555555563', 'EMP003', '33333333-3333-3333-3333-333333333333', 'المستودعات', 'مشرف مستودع', '2023-11-10', '44444444-4444-4444-4444-444444444444', 25, 15);


-- ============================================
-- الجزء الثالث: عرض ملخص البيانات المضافة
-- ============================================

-- عرض الشركات
SELECT 'الشركات:' as table_name, COUNT(*) as count FROM companies
UNION ALL
SELECT 'الفروع:', COUNT(*) FROM branches
UNION ALL
SELECT 'المواقع:', COUNT(*) FROM locations
UNION ALL
SELECT 'الورديات:', COUNT(*) FROM shifts
UNION ALL
SELECT 'المستخدمين:', COUNT(*) FROM users
UNION ALL
SELECT 'الموظفين:', COUNT(*) FROM employees
UNION ALL
SELECT 'مدراء المواقع:', COUNT(*) FROM location_managers;

-- ============================================
-- ملخص بيانات الدخول للنظام
-- ============================================

/*
============================================
بيانات تسجيل الدخول للنظام
============================================

1. المدير العام (Super Admin):
   Username: admin
   Password: password123
   الصلاحيات: إدارة كاملة للنظام

2. مدير الموارد البشرية (HR Admin):
   Username: hr1
   Password: password123
   الصلاحيات: إدارة الموظفين والإجازات والتقارير

3. مدير الموقع (Location Manager):
   Username: manager1
   Password: password123
   الصلاحيات: إدارة الحضور والتحقق من السجلات المشبوهة

4. الموظفين (Employees):
   - Username: ahmad | Password: password123 | القسم: المستودعات
   - Username: fatima | Password: password123 | القسم: الإدارة
   - Username: mohammed | Password: password123 | القسم: مستودع جدة

============================================
*/
