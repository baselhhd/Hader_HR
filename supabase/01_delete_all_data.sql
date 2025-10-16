-- ============================================
-- سكربت حذف جميع البيانات من قاعدة البيانات
-- Hader HR System - Delete All Data Script
-- ============================================
--
-- هذا السكربت يحذف جميع البيانات من جميع الجداول
-- بالترتيب الصحيح لتجنب مشاكل Foreign Keys
--
-- ⚠️ تحذير: هذا السكربت سيحذف جميع البيانات نهائياً
-- ============================================

-- تعطيل Row Level Security مؤقتاً لضمان حذف جميع البيانات
SET session_replication_role = 'replica';

-- ============================================
-- الجزء الأول: حذف الجداول التابعة (Child Tables)
-- ============================================

TRUNCATE TABLE verification_requests CASCADE;
TRUNCATE TABLE attendance_records CASCADE;
TRUNCATE TABLE leave_requests CASCADE;
TRUNCATE TABLE custom_requests CASCADE;
TRUNCATE TABLE qr_codes CASCADE;
TRUNCATE TABLE color_codes CASCADE;
TRUNCATE TABLE numeric_codes CASCADE;
TRUNCATE TABLE verification_codes CASCADE;

-- ============================================
-- الجزء الثاني: حذف جداول الموظفين والمدراء
-- ============================================

TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE location_managers CASCADE;

-- ============================================
-- الجزء الثالث: حذف المستخدمين
-- ============================================

TRUNCATE TABLE users CASCADE;

-- حذف المستخدمين من auth.users (Supabase Auth)
-- هذا سيحذف جميع المستخدمين من نظام المصادقة
DELETE FROM auth.users;

-- ============================================
-- الجزء الرابع: حذف الورديات والمواقع
-- ============================================

TRUNCATE TABLE shifts CASCADE;
TRUNCATE TABLE locations CASCADE;

-- ============================================
-- الجزء الخامس: حذف الفروع والشركات
-- ============================================

TRUNCATE TABLE branches CASCADE;
TRUNCATE TABLE companies CASCADE;

-- إعادة تفعيل Row Level Security
SET session_replication_role = 'origin';

-- ============================================
-- عرض ملخص الجداول (يجب أن تكون جميعها = 0)
-- ============================================

SELECT
  'companies' as table_name,
  COUNT(*) as record_count
FROM companies

UNION ALL

SELECT 'branches', COUNT(*) FROM branches

UNION ALL

SELECT 'locations', COUNT(*) FROM locations

UNION ALL

SELECT 'shifts', COUNT(*) FROM shifts

UNION ALL

SELECT 'users', COUNT(*) FROM users

UNION ALL

SELECT 'employees', COUNT(*) FROM employees

UNION ALL

SELECT 'location_managers', COUNT(*) FROM location_managers

UNION ALL

SELECT 'attendance_records', COUNT(*) FROM attendance_records

UNION ALL

SELECT 'leave_requests', COUNT(*) FROM leave_requests

UNION ALL

SELECT 'custom_requests', COUNT(*) FROM custom_requests

UNION ALL

SELECT 'verification_requests', COUNT(*) FROM verification_requests

UNION ALL

SELECT 'qr_codes', COUNT(*) FROM qr_codes

UNION ALL

SELECT 'color_codes', COUNT(*) FROM color_codes

UNION ALL

SELECT 'numeric_codes', COUNT(*) FROM numeric_codes

UNION ALL

SELECT 'verification_codes', COUNT(*) FROM verification_codes

UNION ALL

SELECT 'auth.users', COUNT(*) FROM auth.users;

-- ============================================
-- النتيجة المتوقعة:
-- جميع الجداول يجب أن تحتوي على 0 سجل
-- ============================================
