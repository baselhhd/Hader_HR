-- ============================================
-- سكربت إدخال بيانات تجريبية بسيطة وشاملة
-- Hader HR System - Simple Test Data Script
-- ============================================
--
-- بيانات تجريبية سهلة للاختبار والتطوير
-- أسماء بسيطة وكلمات مرور سهلة: 123456
--
-- ============================================

-- تعطيل RLS مؤقتاً
SET session_replication_role = 'replica';

-- ============================================
-- 1️⃣ الشركات (Companies)
-- ============================================

INSERT INTO companies (id, name, logo_url, is_active, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000001', 'شركة النجاح', NULL, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 'شركة التطوير', NULL, true, NOW(), NOW());

-- ============================================
-- 2️⃣ الفروع (Branches)
-- ============================================

INSERT INTO branches (id, company_id, name, address, is_active, created_at, updated_at) VALUES
-- فروع شركة النجاح
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'فرع الرياض', 'الرياض - حي النخيل', true, NOW(), NOW()),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'فرع جدة', 'جدة - حي الحمراء', true, NOW(), NOW()),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'فرع الدمام', 'الدمام - حي الفيصلية', true, NOW(), NOW()),

-- فروع شركة التطوير
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'فرع الرياض', 'الرياض - حي العليا', true, NOW(), NOW());

-- ============================================
-- 3️⃣ المواقع (Locations)
-- ============================================

INSERT INTO locations (id, company_id, branch_id, name, address, lat, lng, gps_radius, is_active, created_at, updated_at) VALUES
-- مواقع فرع الرياض - شركة النجاح
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'المستودع الرئيسي', 'الرياض - طريق الخرج', 24.7136, 46.6753, 100, true, NOW(), NOW()),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'المكتب الإداري', 'الرياض - برج المملكة', 24.7743, 46.7386, 50, true, NOW(), NOW()),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'المعرض التجاري', 'الرياض - طريق الملك فهد', 24.7500, 46.7000, 80, true, NOW(), NOW()),

-- مواقع فرع جدة - شركة النجاح
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'مستودع جدة', 'جدة - طريق مكة', 21.5433, 39.1728, 120, true, NOW(), NOW()),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'مكتب جدة', 'جدة - الكورنيش', 21.4858, 39.1925, 60, true, NOW(), NOW()),

-- مواقع فرع الدمام - شركة النجاح
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'مستودع الدمام', 'الدمام - المنطقة الصناعية', 26.4300, 50.0900, 100, true, NOW(), NOW()),

-- مواقع شركة التطوير
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'المقر الرئيسي', 'الرياض - العليا', 24.7000, 46.6800, 50, true, NOW(), NOW());

-- ============================================
-- 4️⃣ الورديات (Shifts)
-- ============================================

INSERT INTO shifts (id, location_id, name, start_time, end_time, break_start, break_duration, work_hours, late_arrival_buffer, is_active, created_at, updated_at) VALUES
-- ورديات المستودع الرئيسي
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'الوردية الصباحية', '08:00:00', '16:00:00', '12:00:00', 60, 7.00, 15, true, NOW(), NOW()),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'الوردية المسائية', '16:00:00', '00:00:00', '20:00:00', 60, 7.00, 15, true, NOW(), NOW()),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'الوردية الليلية', '00:00:00', '08:00:00', '04:00:00', 60, 7.00, 15, true, NOW(), NOW()),

-- ورديات المكتب الإداري
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'الدوام الإداري', '09:00:00', '17:00:00', '13:00:00', 60, 7.00, 15, true, NOW(), NOW()),

-- ورديات المعرض التجاري
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'دوام المعرض', '10:00:00', '22:00:00', '15:00:00', 120, 10.00, 15, true, NOW(), NOW()),

-- ورديات مستودع جدة
('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', 'الوردية الصباحية', '08:00:00', '16:00:00', '12:00:00', 60, 7.00, 15, true, NOW(), NOW()),

-- ورديات مكتب جدة
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000005', 'الدوام الإداري', '09:00:00', '17:00:00', '13:00:00', 60, 7.00, 10, true, NOW(), NOW()),

-- ورديات مستودع الدمام
('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000006', 'الوردية الصباحية', '07:00:00', '15:00:00', '11:00:00', 60, 7.00, 15, true, NOW(), NOW()),

-- ورديات شركة التطوير
('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000007', 'الدوام العام', '09:00:00', '18:00:00', '13:00:00', 60, 8.00, 15, true, NOW(), NOW());

-- ============================================
-- 5️⃣ المستخدمين (Users & Auth)
-- ============================================
-- كلمة المرور لجميع المستخدمين: 123456
-- ============================================

-- 🔴 المدراء العامون (Super Admins) - 2 مستخدم
-- ============================================

-- مدير عام 1
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "admin", "full_name": "أحمد المدير"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'admin', 'admin@test.com', '+966500000001', 'أحمد المدير', 'super_admin', true, NOW(), NOW());

-- مدير عام 2
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'admin2@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "admin2", "full_name": "سارة المديرة"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', NULL, 'admin2', 'admin2@test.com', '+966500000002', 'سارة المديرة', 'super_admin', true, NOW(), NOW());

-- 🟠 مدراء الموارد البشرية (HR Admins) - 2 مستخدم
-- ============================================

-- مدير موارد بشرية 1
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'hr@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "hr", "full_name": "خالد الموارد البشرية"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'hr', 'hr@test.com', '+966500000003', 'خالد الموارد البشرية', 'hr_admin', true, NOW(), NOW());

-- مدير موارد بشرية 2
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'hr2@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "hr2", "full_name": "فاطمة الموارد البشرية"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'hr2', 'hr2@test.com', '+966500000004', 'فاطمة الموارد البشرية', 'hr_admin', true, NOW(), NOW());

-- 🟡 مدراء المواقع (Location Managers) - 4 مستخدمين
-- ============================================

-- مدير موقع 1 - المستودع الرئيسي
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'manager1@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "manager1", "full_name": "محمد مدير المستودع"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'manager1', 'manager1@test.com', '+966500000005', 'محمد مدير المستودع', 'loc_manager', true, NOW(), NOW());

INSERT INTO location_managers (location_id, user_id, created_at) VALUES
('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', NOW());

-- مدير موقع 2 - المكتب الإداري
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'manager2@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "manager2", "full_name": "نورة مديرة المكتب"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'manager2', 'manager2@test.com', '+966500000006', 'نورة مديرة المكتب', 'loc_manager', true, NOW(), NOW());

INSERT INTO location_managers (location_id, user_id, created_at) VALUES
('20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000006', NOW());

-- مدير موقع 3 - مستودع جدة
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000000',
  'manager3@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "manager3", "full_name": "عبدالله مدير جدة"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'manager3', 'manager3@test.com', '+966500000007', 'عبدالله مدير جدة', 'loc_manager', true, NOW(), NOW());

INSERT INTO location_managers (location_id, user_id, created_at) VALUES
('20000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000007', NOW());

-- مدير موقع 4 - مستودع الدمام
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000000',
  'manager4@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "manager4", "full_name": "مريم مديرة الدمام"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'manager4', 'manager4@test.com', '+966500000008', 'مريم مديرة الدمام', 'loc_manager', true, NOW(), NOW());

INSERT INTO location_managers (location_id, user_id, created_at) VALUES
('20000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000008', NOW());

-- 🟢 الموظفون (Employees) - 10 موظفين
-- ============================================

-- موظف 1: علي - المستودع الرئيسي
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000000',
  'ali@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "ali", "full_name": "علي أحمد"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ali', 'ali@test.com', '+966500000011', 'علي أحمد', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000011', 'E001', '20000000-0000-0000-0000-000000000001', 'المستودعات', 'عامل مستودع', '2024-01-01', '30000000-0000-0000-0000-000000000001', 21, 15, NOW(), NOW());

-- موظف 2: ليلى - المكتب الإداري
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000000',
  'layla@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "layla", "full_name": "ليلى محمد"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'layla', 'layla@test.com', '+966500000012', 'ليلى محمد', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000012', 'E002', '20000000-0000-0000-0000-000000000002', 'المالية', 'محاسبة', '2024-02-01', '30000000-0000-0000-0000-000000000004', 20, 15, NOW(), NOW());

-- موظف 3: يوسف - المستودع الرئيسي (وردية مسائية)
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000000',
  'youssef@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "youssef", "full_name": "يوسف خالد"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'youssef', 'youssef@test.com', '+966500000013', 'يوسف خالد', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000013', 'E003', '20000000-0000-0000-0000-000000000001', 'المستودعات', 'مشرف مستودع', '2024-03-01', '30000000-0000-0000-0000-000000000002', 25, 15, NOW(), NOW());

-- موظف 4: هند - المكتب الإداري
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000000',
  'hind@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "hind", "full_name": "هند عبدالله"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'hind', 'hind@test.com', '+966500000014', 'هند عبدالله', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000014', 'E004', '20000000-0000-0000-0000-000000000002', 'الموارد البشرية', 'أخصائي موارد بشرية', '2024-04-01', '30000000-0000-0000-0000-000000000004', 18, 15, NOW(), NOW());

-- موظف 5: سعيد - المعرض التجاري
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000015',
  '00000000-0000-0000-0000-000000000000',
  'saeed@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "saeed", "full_name": "سعيد فهد"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'saeed', 'saeed@test.com', '+966500000015', 'سعيد فهد', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000015', 'E005', '20000000-0000-0000-0000-000000000003', 'المبيعات', 'مندوب مبيعات', '2024-05-01', '30000000-0000-0000-0000-000000000005', 22, 15, NOW(), NOW());

-- موظف 6: منى - مستودع جدة
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-000000000000',
  'mona@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "mona", "full_name": "منى سعد"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'mona', 'mona@test.com', '+966500000016', 'منى سعد', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000016', 'E006', '20000000-0000-0000-0000-000000000004', 'المستودعات', 'عامل مستودع', '2024-06-01', '30000000-0000-0000-0000-000000000006', 21, 15, NOW(), NOW());

-- موظف 7: طارق - مكتب جدة
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000017',
  '00000000-0000-0000-0000-000000000000',
  'tarek@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "tarek", "full_name": "طارق ناصر"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'tarek', 'tarek@test.com', '+966500000017', 'طارق ناصر', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000017', 'E007', '20000000-0000-0000-0000-000000000005', 'المالية', 'محاسب', '2024-07-01', '30000000-0000-0000-0000-000000000007', 19, 15, NOW(), NOW());

-- موظف 8: رنا - مستودع الدمام
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000018',
  '00000000-0000-0000-0000-000000000000',
  'rana@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "rana", "full_name": "رنا علي"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'rana', 'rana@test.com', '+966500000018', 'رنا علي', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000018', 'E008', '20000000-0000-0000-0000-000000000006', 'المستودعات', 'مشرفة مستودع', '2024-08-01', '30000000-0000-0000-0000-000000000008', 24, 15, NOW(), NOW());

-- موظف 9: ماجد - المستودع الرئيسي (وردية ليلية)
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000019',
  '00000000-0000-0000-0000-000000000000',
  'majed@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "majed", "full_name": "ماجد حسن"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'majed', 'majed@test.com', '+966500000019', 'ماجد حسن', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000019', 'E009', '20000000-0000-0000-0000-000000000001', 'المستودعات', 'حارس ليلي', '2024-09-01', '30000000-0000-0000-0000-000000000003', 21, 15, NOW(), NOW());

-- موظف 10: سلمى - شركة التطوير
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
) VALUES (
  '40000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000000',
  'salma@test.com',
  crypt('123456', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"username": "salma", "full_name": "سلمى عمر"}'::jsonb,
  'authenticated', 'authenticated'
);

INSERT INTO users (id, company_id, branch_id, username, email, phone, full_name, role, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'salma', 'salma@test.com', '+966500000020', 'سلمى عمر', 'employee', true, NOW(), NOW());

INSERT INTO employees (user_id, employee_number, location_id, department, position, hire_date, shift_id, vacation_balance, sick_leave_balance, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000020', 'E010', '20000000-0000-0000-0000-000000000007', 'التطوير', 'مطورة برمجيات', '2024-10-01', '30000000-0000-0000-0000-000000000009', 23, 15, NOW(), NOW());

-- إعادة تفعيل RLS
SET session_replication_role = 'origin';

-- ============================================
-- 📊 عرض ملخص البيانات المضافة
-- ============================================

SELECT
  '🏢 الشركات' as "الجدول",
  COUNT(*)::text as "عدد السجلات"
FROM companies

UNION ALL

SELECT '🏪 الفروع', COUNT(*)::text FROM branches

UNION ALL

SELECT '📍 المواقع', COUNT(*)::text FROM locations

UNION ALL

SELECT '⏰ الورديات', COUNT(*)::text FROM shifts

UNION ALL

SELECT '👥 المستخدمين', COUNT(*)::text FROM users

UNION ALL

SELECT '👷 الموظفين', COUNT(*)::text FROM employees

UNION ALL

SELECT '👨‍💼 مدراء المواقع', COUNT(*)::text FROM location_managers

UNION ALL

SELECT '🔐 مستخدمي Auth', COUNT(*)::text FROM auth.users;

-- ============================================
-- ✅ بيانات تسجيل الدخول
-- ============================================

/*
════════════════════════════════════════════════════════════════
🔑 بيانات تسجيل الدخول لجميع المستخدمين
════════════════════════════════════════════════════════════════
📝 كلمة المرور لجميع الحسابات: 123456
════════════════════════════════════════════════════════════════

🔴 المدراء العامون (Super Admins):
   1. Username: admin     | Email: admin@test.com    | الاسم: أحمد المدير
   2. Username: admin2    | Email: admin2@test.com   | الاسم: سارة المديرة

🟠 مدراء الموارد البشرية (HR Admins):
   3. Username: hr        | Email: hr@test.com       | الاسم: خالد الموارد البشرية
   4. Username: hr2       | Email: hr2@test.com      | الاسم: فاطمة الموارد البشرية

🟡 مدراء المواقع (Location Managers):
   5. Username: manager1  | Email: manager1@test.com | الاسم: محمد مدير المستودع
   6. Username: manager2  | Email: manager2@test.com | الاسم: نورة مديرة المكتب
   7. Username: manager3  | Email: manager3@test.com | الاسم: عبدالله مدير جدة
   8. Username: manager4  | Email: manager4@test.com | الاسم: مريم مديرة الدمام

🟢 الموظفون (Employees):
   9.  Username: ali      | Email: ali@test.com      | رقم: E001 | علي أحمد
   10. Username: layla    | Email: layla@test.com    | رقم: E002 | ليلى محمد
   11. Username: youssef  | Email: youssef@test.com  | رقم: E003 | يوسف خالد
   12. Username: hind     | Email: hind@test.com     | رقم: E004 | هند عبدالله
   13. Username: saeed    | Email: saeed@test.com    | رقم: E005 | سعيد فهد
   14. Username: mona     | Email: mona@test.com     | رقم: E006 | منى سعد
   15. Username: tarek    | Email: tarek@test.com    | رقم: E007 | طارق ناصر
   16. Username: rana     | Email: rana@test.com     | رقم: E008 | رنا علي
   17. Username: majed    | Email: majed@test.com    | رقم: E009 | ماجد حسن
   18. Username: salma    | Email: salma@test.com    | رقم: E010 | سلمى عمر

════════════════════════════════════════════════════════════════
📊 ملخص البيانات:
════════════════════════════════════════════════════════════════
✅ 2 شركات
✅ 4 فروع
✅ 7 مواقع
✅ 9 ورديات
✅ 18 مستخدماً (2 مدير عام + 2 HR + 4 مدراء مواقع + 10 موظفين)
✅ 10 موظفين مع بياناتهم الكاملة
✅ 4 مدراء مواقع مرتبطين بمواقعهم
════════════════════════════════════════════════════════════════
*/
