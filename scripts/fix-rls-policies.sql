-- Fix RLS Policies - Remove infinite recursion
-- يجب تنفيذ هذا في Supabase SQL Editor

-- 1. تعطيل RLS مؤقتاً على جدول users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. حذف جميع policies الموجودة على users
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can update own email and phone" ON users;
DROP POLICY IF EXISTS "Super admins see all" ON users;
DROP POLICY IF EXISTS "HR sees company data" ON users;
DROP POLICY IF EXISTS "Employees see own records" ON users;

-- 3. إعادة تفعيل RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء policies بسيطة وصحيحة

-- السماح للمستخدمين بقراءة بياناتهم الخاصة
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- السماح للمستخدمين بتحديث بياناتهم الخاصة
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- السماح للمستخدمين غير المصادق عليهم بالبحث عن username فقط (للتسجيل الدخول)
CREATE POLICY "Allow username lookup for login"
  ON users FOR SELECT
  TO anon
  USING (true);

-- ملاحظة: هذه policy مؤقتة للتطوير فقط
-- في الإنتاج يجب استبدالها بـ function للتسجيل الدخول
