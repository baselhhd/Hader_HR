-- Migration: Improve Authentication System
-- تحسين نظام المصادقة لدعم Username كمعرف أساسي مع Email و Phone اختياريين

-- 1. التأكد من أن email و phone قابلين للـ null (اختياريين)
-- هذا موجود بالفعل في schema لكن نتأكد

-- 2. إضافة constraints إضافية للـ username
-- التأكد من أن username فريد وغير فارغ
ALTER TABLE users
  ADD CONSTRAINT username_not_empty
  CHECK (LENGTH(TRIM(username)) > 0);

-- 3. إضافة index على username لتحسين الأداء عند البحث
-- (موجود بالفعل لكن نتأكد)
CREATE INDEX IF NOT EXISTS idx_users_username_lookup ON users(LOWER(username));

-- 4. إضافة دالة للتحقق من Email داخلي
CREATE OR REPLACE FUNCTION is_internal_email(email_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email_address LIKE '%@internal.hader.local';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. إضافة دالة لتوليد Email داخلي من username
CREATE OR REPLACE FUNCTION generate_internal_email(username_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(TRIM(username_input)) || '@internal.hader.local';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. تحديث trigger للتعامل مع Email التلقائي (اختياري)
-- هذا مفيد إذا أردنا توليد email تلقائياً عند إنشاء مستخدم بدون email

-- 7. إضافة ملاحظات للتوثيق
COMMENT ON COLUMN users.email IS 'البريد الإلكتروني الحقيقي للمستخدم (اختياري). إذا كان ينتهي بـ @internal.hader.local فهو email مُولد داخلياً';
COMMENT ON COLUMN users.phone IS 'رقم الجوال (اختياري). مطلوب للتكامل مع WhatsApp/Evolution API لاحقاً';
COMMENT ON COLUMN users.username IS 'اسم المستخدم الفريد (إلزامي). يُستخدم لتسجيل الدخول';

-- 8. إنشاء view لعرض معلومات المستخدمين مع حالة Email
CREATE OR REPLACE VIEW users_with_email_status AS
SELECT
  u.*,
  CASE
    WHEN u.email IS NULL THEN 'no_email'
    WHEN is_internal_email(u.email) THEN 'internal_email'
    ELSE 'real_email'
  END AS email_status,
  CASE
    WHEN u.phone IS NOT NULL THEN true
    ELSE false
  END AS has_phone
FROM users u;

COMMENT ON VIEW users_with_email_status IS 'عرض المستخدمين مع معلومات إضافية عن حالة البريد الإلكتروني والجوال';

-- 9. تحديث RLS policies لتحسين الأمان
-- السماح للمستخدمين بتحديث email و phone الخاصين بهم
CREATE POLICY "Users can update own email and phone"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 10. إنشاء دالة للتحقق من صحة رقم الجوال السعودي
CREATE OR REPLACE FUNCTION is_valid_saudi_phone(phone_number TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  clean_phone TEXT;
BEGIN
  -- إزالة المسافات والشرطات
  clean_phone := REGEXP_REPLACE(phone_number, '[\s\-]', '', 'g');

  -- التحقق من الأنماط المقبولة
  RETURN clean_phone ~ '^\+966[5][0-9]{8}$' OR
         clean_phone ~ '^966[5][0-9]{8}$' OR
         clean_phone ~ '^0[5][0-9]{8}$' OR
         clean_phone ~ '^[5][0-9]{8}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 11. إضافة constraint للتحقق من صحة رقم الجوال
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS valid_saudi_phone;

ALTER TABLE users
  ADD CONSTRAINT valid_saudi_phone
  CHECK (phone IS NULL OR is_valid_saudi_phone(phone));

-- 12. دالة لتنسيق رقم الجوال إلى صيغة دولية
CREATE OR REPLACE FUNCTION format_saudi_phone(phone_number TEXT)
RETURNS TEXT AS $$
DECLARE
  clean_phone TEXT;
BEGIN
  IF phone_number IS NULL THEN
    RETURN NULL;
  END IF;

  -- إزالة المسافات والشرطات
  clean_phone := REGEXP_REPLACE(phone_number, '[\s\-]', '', 'g');

  -- تنسيق حسب الحالة
  IF clean_phone LIKE '+966%' THEN
    RETURN clean_phone;
  ELSIF clean_phone LIKE '966%' THEN
    RETURN '+' || clean_phone;
  ELSIF clean_phone LIKE '0%' THEN
    RETURN '+966' || SUBSTRING(clean_phone FROM 2);
  ELSE
    RETURN '+966' || clean_phone;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 13. Trigger لتنسيق رقم الجوال تلقائياً عند الإدراج أو التحديث
CREATE OR REPLACE FUNCTION auto_format_phone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := format_saudi_phone(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_format_phone ON users;
CREATE TRIGGER trigger_auto_format_phone
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_format_phone();

-- 14. إنشاء جدول لتتبع تغييرات Email (للأمان والتدقيق)
CREATE TABLE IF NOT EXISTS email_change_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_email TEXT,
  new_email TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_email_history_user ON email_change_history(user_id);
CREATE INDEX idx_email_history_date ON email_change_history(changed_at);

COMMENT ON TABLE email_change_history IS 'سجل تغييرات البريد الإلكتروني للمستخدمين (للتدقيق والأمان)';

-- 15. دالة لتسجيل تغيير Email
CREATE OR REPLACE FUNCTION log_email_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO email_change_history (user_id, old_email, new_email, changed_by)
    VALUES (NEW.id, OLD.email, NEW.email, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_email_change ON users;
CREATE TRIGGER trigger_log_email_change
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_email_change();

-- 16. RLS على email_change_history
ALTER TABLE email_change_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email history"
  ON email_change_history FOR SELECT
  USING (user_id = auth.uid());

-- 17. إضافة تعليقات توثيقية
COMMENT ON FUNCTION is_internal_email IS 'التحقق من أن البريد الإلكتروني داخلي (مُولد) وليس حقيقي';
COMMENT ON FUNCTION generate_internal_email IS 'توليد بريد إلكتروني داخلي من اسم المستخدم';
COMMENT ON FUNCTION is_valid_saudi_phone IS 'التحقق من صحة رقم الجوال السعودي';
COMMENT ON FUNCTION format_saudi_phone IS 'تنسيق رقم الجوال السعودي إلى صيغة دولية (+966XXXXXXXXX)';
