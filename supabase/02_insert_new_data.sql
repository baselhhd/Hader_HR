-- ============================================
-- سكربت إضافة بيانات جديدة لقاعدة البيانات
-- Hader HR System - Insert New Data Script
-- ============================================
--
-- هذا السكربت يضيف بيانات تجريبية جديدة للنظام
-- يجب تنفيذ سكربت الحذف (01_delete_all_data.sql) أولاً
--
-- ============================================

-- ============================================
-- 1. إضافة الشركة
-- ============================================

INSERT INTO companies (id, name, logo_url, is_active, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'شركة حاضر للحضور الذكي', NULL, true, NOW(), NOW());

-- ============================================
-- 2. إضافة الفروع
-- ============================================

INSERT INTO branches (id, company_id, name, address, is_active, created_at, updated_at) VALUES
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'الفرع الرئيسي - الرياض', 'الرياض - حي الملك فهد - طريق الملك عبدالله', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'فرع جدة', 'جدة - حي الزهراء - شارع الأمير سلطان', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'فرع الدمام', 'الدمام - حي الفيصلية - شارع الملك فهد', true, NOW(), NOW());

-- ============================================
-- 3. إضافة المواقع (Locations)
-- ============================================

INSERT INTO locations (id, company_id, branch_id, name, address, lat, lng, gps_radius, is_active, created_at, updated_at) VALUES
-- مواقع الفرع الرئيسي - الرياض
('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'مستودع الشرق', 'الرياض - طريق الدمام الفرعي', 24.713600, 46.675300, 100, true, NOW(), NOW()),
('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'المكتب الإداري الرئيسي', 'الرياض - برج المملكة - الدور 15', 24.774265, 46.738586, 50, true, NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'مستودع الغرب', 'الرياض - طريق مكة القديم', 24.630000, 46.580000, 120, true, NOW(), NOW()),

-- مواقع فرع جدة
('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'مستودع جدة الرئيسي', 'جدة - طريق مكة القديم', 21.543333, 39.172779, 150, true, NOW(), NOW()),
('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'مكتب جدة الإداري', 'جدة - الكورنيش - برج النخيل', 21.485811, 39.192505, 80, true, NOW(), NOW()),

-- مواقع فرع الدمام
('33333333-3333-3333-3333-333333333336', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', 'مستودع الدمام', 'الدمام - المنطقة الصناعية الثانية', 26.430000, 50.090000, 100, true, NOW(), NOW());

-- ============================================
-- 4. إضافة الورديات (Shifts)
-- ============================================

INSERT INTO shifts (id, location_id, name, start_time, end_time, break_start, break_duration, work_hours, late_arrival_buffer, is_active, created_at, updated_at) VALUES
-- ورديات مستودع الشرق
('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'الوردية الصباحية', '08:00:00', '17:00:00', '12:00:00', 60, 8.00, 15, true, NOW(), NOW()),
('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333331', 'الوردية المسائية', '17:00:00', '02:00:00', '21:00:00', 60, 8.00, 15, true, NOW(), NOW()),

-- ورديات المكتب الإداري
('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333332', 'الدوام الرسمي', '09:00:00', '18:00:00', '13:00:00', 60, 8.00, 15, true, NOW(), NOW()),

-- ورديات مستودع الغرب
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'الوردية الصباحية', '08:00:00', '17:00:00', '12:00:00', 60, 8.00, 15, true, NOW(), NOW()),

-- ورديات مستودع جدة
('44444444-4444-4444-4444-444444444445', '33333333-3333-3333-3333-333333333334', 'الوردية الصباحية', '08:00:00', '17:00:00', '12:00:00', 60, 8.00, 15, true, NOW(), NOW()),
('44444444-4444-4444-4444-444444444446', '33333333-3333-3333-3333-333333333335', 'الدوام الإداري', '09:00:00', '18:00:00', '13:00:00', 60, 8.00, 10, true, NOW(), NOW()),

-- ورديات مستودع الدمام
('44444444-4444-4444-4444-444444444447', '33333333-3333-3333-3333-333333333336', 'الوردية الصباحية', '07:30:00', '16:30:00', '12:00:00', 60, 8.00, 15, true, NOW(), NOW());

-- ============================================
-- 5. إضافة المستخدمين (Users)
-- ============================================

-- ملاحظة: سنضيف المستخدمين في auth.users أولاً ثم في جدول users

-- 5.1 المدير العام (Super Admin)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '55555555-5555-5555-5555-555555555551',
  '00000000-0000-0000-0000-000000000000',
  'admin@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "admin", "full_name": "المدير العام", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb,
  'authenticated',
  'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', NULL, 'admin', 'admin@hader.local', '+966501234567', 'عبدالله المدير - المدير العام', 'super_admin', true, NOW(), NOW());

-- 5.2 مدير الموارد البشرية (HR Admin)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '55555555-5555-5555-5555-555555555552',
  '00000000-0000-0000-0000-000000000000',
  'hr@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "hr1", "full_name": "سارة أحمد", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb,
  'authenticated',
  'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'hr1', 'hr@hader.local', '+966502345678', 'سارة أحمد - مدير الموارد البشرية', 'hr_admin', true, NOW(), NOW());

-- 5.3 مدير موقع - مستودع الشرق (Location Manager)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '55555555-5555-5555-5555-555555555553',
  '00000000-0000-0000-0000-000000000000',
  'manager1@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "manager1", "full_name": "خالد محمد", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb,
  'authenticated',
  'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'manager1', 'manager1@hader.local', '+966503456789', 'خالد محمد - مدير مستودع الشرق', 'loc_manager', true, NOW(), NOW());

-- ربط مدير الموقع بالمستودع
INSERT INTO location_managers (location_id, user_id, created_at) VALUES
('33333333-3333-3333-3333-333333333331', '55555555-5555-5555-5555-555555555553', NOW());

-- 5.4 مدير موقع - مستودع جدة (Location Manager 2)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '55555555-5555-5555-5555-555555555554',
  '00000000-0000-0000-0000-000000000000',
  'manager2@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "manager2", "full_name": "فهد العتيبي", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb,
  'authenticated',
  'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555554', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'manager2', 'manager2@hader.local', '+966504567890', 'فهد العتيبي - مدير مستودع جدة', 'loc_manager', true, NOW(), NOW());

-- ربط مدير الموقع بمستودع جدة
INSERT INTO location_managers (location_id, user_id, created_at) VALUES
('33333333-3333-3333-3333-333333333334', '55555555-5555-5555-5555-555555555554', NOW());

-- ============================================
-- 6. إضافة الموظفين (Employees)
-- ============================================

-- موظف 1: أحمد علي - مستودع الشرق
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '66666666-6666-6666-6666-666666666661',
  '00000000-0000-0000-0000-000000000000',
  'ahmad@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "ahmad", "full_name": "أحمد علي", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb,
  'authenticated',
  'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'ahmad', 'ahmad@hader.local', '+966511111111', 'أحمد علي السعيد', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666661', 'EMP001', '33333333-3333-3333-3333-333333333331', 'المستودعات', 'عامل مستودع', '2024-01-15', '44444444-4444-4444-4444-444444444441', 21, 15, NOW(), NOW());

-- موظف 2: فاطمة محمد - المكتب الإداري
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '66666666-6666-6666-6666-666666666662',
  '00000000-0000-0000-0000-000000000000',
  'fatima@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "fatima", "full_name": "فاطمة محمد", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb,
  'authenticated',
  'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'fatima', 'fatima@hader.local', '+966522222222', 'فاطمة محمد الأحمدي', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666662', 'EMP002', '33333333-3333-3333-3333-333333333332', 'المالية', 'محاسبة', '2024-03-01', '44444444-4444-4444-4444-444444444443', 18, 15, NOW(), NOW());

-- موظف 3: محمد سعيد - مستودع جدة
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '66666666-6666-6666-6666-666666666663',
  '00000000-0000-0000-0000-000000000000',
  'mohammed@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "mohammed", "full_name": "محمد سعيد", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb,
  'authenticated',
  'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666663', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'mohammed', 'mohammed@hader.local', '+966533333333', 'محمد سعيد القحطاني', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666663', 'EMP003', '33333333-3333-3333-3333-333333333334', 'المستودعات', 'مشرف مستودع', '2023-11-10', '44444444-4444-4444-4444-444444444445', 25, 15, NOW(), NOW());

-- موظف 4: نورة عبدالله - المكتب الإداري
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '66666666-6666-6666-6666-666666666664',
  '00000000-0000-0000-0000-000000000000',
  'noura@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "noura", "full_name": "نورة عبدالله", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb,
  'authenticated',
  'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666664', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'noura', 'noura@hader.local', '+966544444444', 'نورة عبدالله الدوسري', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666664', 'EMP004', '33333333-3333-3333-3333-333333333332', 'الموارد البشرية', 'أخصائي موارد بشرية', '2024-02-20', '44444444-4444-4444-4444-444444444443', 20, 15, NOW(), NOW());

-- موظف 5: يوسف حسن - مستودع الدمام
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '66666666-6666-6666-6666-666666666665',
  '00000000-0000-0000-0000-000000000000',
  'yousef@hader.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"username": "yousef", "full_name": "يوسف حسن", "company_id": "11111111-1111-1111-1111-111111111111"}'::jsonb,
  'authenticated',
  'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666665', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', 'yousef', 'yousef@hader.local', '+966555555555', 'يوسف حسن المطيري', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666665', 'EMP005', '33333333-3333-3333-3333-333333333336', 'المستودعات', 'عامل مستودع', '2024-05-01', '44444444-4444-4444-4444-444444444447', 21, 15, NOW(), NOW());

-- ============================================
-- 7. عرض ملخص البيانات المضافة
-- ============================================

SELECT
  'الشركات' as "الجدول",
  COUNT(*)::text as "عدد السجلات"
FROM companies

UNION ALL

SELECT 'الفروع', COUNT(*)::text FROM branches

UNION ALL

SELECT 'المواقع', COUNT(*)::text FROM locations

UNION ALL

SELECT 'الورديات', COUNT(*)::text FROM shifts

UNION ALL

SELECT 'المستخدمين', COUNT(*)::text FROM users

UNION ALL

SELECT 'الموظفين', COUNT(*)::text FROM employees

UNION ALL

SELECT 'مدراء المواقع', COUNT(*)::text FROM location_managers

UNION ALL

SELECT 'مستخدمي Auth', COUNT(*)::text FROM auth.users;

-- ============================================
-- ملخص بيانات الدخول للنظام
-- ============================================

/*
============================================
✅ بيانات تسجيل الدخول للنظام
============================================

👑 المدير العام (Super Admin):
   Username: admin
   Password: password123
   الاسم: عبدالله المدير
   الصلاحيات: إدارة كاملة للنظام

👨‍💼 مدير الموارد البشرية (HR Admin):
   Username: hr1
   Password: password123
   الاسم: سارة أحمد
   الصلاحيات: إدارة الموظفين والإجازات والتقارير

📍 مدير موقع - مستودع الشرق (Location Manager):
   Username: manager1
   Password: password123
   الاسم: خالد محمد
   الموقع: مستودع الشرق - الرياض
   الصلاحيات: إدارة حضور مستودع الشرق

📍 مدير موقع - مستودع جدة (Location Manager):
   Username: manager2
   Password: password123
   الاسم: فهد العتيبي
   الموقع: مستودع جدة الرئيسي
   الصلاحيات: إدارة حضور مستودع جدة

👷 الموظفون (Employees):

   1. Username: ahmad | Password: password123
      الاسم: أحمد علي السعيد
      رقم الموظف: EMP001
      القسم: المستودعات | الموقع: مستودع الشرق
      الوردية: الصباحية (8:00-17:00)
      رصيد الإجازات: 21 يوم

   2. Username: fatima | Password: password123
      الاسم: فاطمة محمد الأحمدي
      رقم الموظف: EMP002
      القسم: المالية | الموقع: المكتب الإداري
      الوردية: الدوام الرسمي (9:00-18:00)
      رصيد الإجازات: 18 يوم

   3. Username: mohammed | Password: password123
      الاسم: محمد سعيد القحطاني
      رقم الموظف: EMP003
      القسم: المستودعات | الموقع: مستودع جدة
      الوردية: الصباحية (8:00-17:00)
      رصيد الإجازات: 25 يوم

   4. Username: noura | Password: password123
      الاسم: نورة عبدالله الدوسري
      رقم الموظف: EMP004
      القسم: الموارد البشرية | الموقع: المكتب الإداري
      الوردية: الدوام الرسمي (9:00-18:00)
      رصيد الإجازات: 20 يوم

   5. Username: yousef | Password: password123
      الاسم: يوسف حسن المطيري
      رقم الموظف: EMP005
      القسم: المستودعات | الموقع: مستودع الدمام
      الوردية: الصباحية (7:30-16:30)
      رصيد الإجازات: 21 يوم

============================================
📊 إجمالي البيانات المضافة:
============================================
✅ 1 شركة
✅ 3 فروع (الرياض، جدة، الدمام)
✅ 6 مواقع
✅ 7 ورديات
✅ 9 مستخدمين (1 مدير عام + 1 HR + 2 مدراء مواقع + 5 موظفين)
============================================
*/
