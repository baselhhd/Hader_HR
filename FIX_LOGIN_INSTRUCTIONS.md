# إصلاح مشكلة تسجيل الدخول - RLS Infinite Recursion

## المشكلة الحالية
عند محاولة تسجيل الدخول، يحدث خطأ:
```
infinite recursion detected in policy for relation "users"
```

هذا يحدث بسبب أن RLS policies على جدول `users` تحتوي على circular dependency (اعتماد دائري).

## الحل - خطوات التنفيذ

### الخطوة 1: افتح Supabase Dashboard
1. اذهب إلى: https://supabase.com/dashboard
2. سجل الدخول إلى مشروعك
3. اختر المشروع: **Hader HR**

### الخطوة 2: افتح SQL Editor
1. من القائمة الجانبية، اضغط على **SQL Editor**
2. اضغط على **New query** لإنشاء استعلام جديد

### الخطوة 3: نفّذ السكريبت
1. انسخ محتوى الملف: `scripts/fix-rls-policies.sql`
2. الصق المحتوى في SQL Editor
3. اضغط على **Run** أو اضغط `Ctrl + Enter`

### الخطوة 4: تحقق من النتيجة
يجب أن ترى رسائل نجاح لجميع الأوامر:
- ALTER TABLE (تعطيل RLS)
- DROP POLICY (حذف Policies القديمة)
- ALTER TABLE (تفعيل RLS)
- CREATE POLICY (إنشاء Policies الجديدة)

## اختبار تسجيل الدخول بعد الإصلاح

بعد تنفيذ السكريبت، جرب تسجيل الدخول بأحد الحسابات التالية:

### حساب موظف:
- **اسم المستخدم**: `ahmed_ali`
- **كلمة المرور**: `Test123!`

### حساب HR:
- **اسم المستخدم**: `fatima_hr`
- **كلمة المرور**: `Test123!`

### حساب مدير موقع:
- **اسم المستخدم**: `khalid_manager`
- **كلمة المرور**: `Test123!`

## إذا استمرت المشكلة

إذا لم ينجح تسجيل الدخول بعد تنفيذ السكريبت، تحقق من:

1. **تحقق من البيانات في قاعدة البيانات**:
   ```bash
   npm run check-db
   ```

2. **تحقق من Logs في Supabase**:
   - اذهب إلى **Logs** → **Postgres Logs**
   - ابحث عن أي أخطاء

3. **أعد تشغيل المشروع**:
   ```bash
   npm run dev
   ```

## ملاحظات مهمة

⚠️ **Policy المؤقتة للتطوير**:
السكريبت يحتوي على policy تسمح لأي شخص بقراءة جدول users (للتسجيل الدخول):
```sql
CREATE POLICY "Allow username lookup for login"
  ON users FOR SELECT
  TO anon
  USING (true);
```

هذه Policy **مؤقتة للتطوير فقط**. في الإنتاج يجب استبدالها بـ Database Function للتسجيل الدخول.

## الخطوات التالية بعد الإصلاح

1. ✅ اختبار تسجيل الدخول لجميع الأدوار
2. ✅ اختبار صفحة الملف الشخصي (تحديث Email و Phone)
3. ✅ اختبار Check-in/Check-out
4. 🔨 بناء صفحات HR Admin
5. 🔨 بناء صفحات Super Admin
