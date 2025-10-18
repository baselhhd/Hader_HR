# 🗄️ Database Schema - هيكل قاعدة البيانات

تم استخراج هذا الـ Schema من Supabase بتاريخ: **2025-10-18**

---

## 📊 الجداول الرئيسية (15 جدول)

### 1️⃣ Companies (الشركات)
```sql
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url text,
  settings jsonb DEFAULT '{"suspicion": {...}, "verification": {...}, "attendance_methods": {...}}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 2 شركة
- شركة التطوير التقني
- شركة الحلول الذكية

**Settings الافتراضية:**
- `suspicion.enabled`: true
- `suspicion.threshold`: 50
- `verification.gps.radius`: 100 متر
- `attendance_methods`: QR Code, Color Code, Numeric Code

---

### 2️⃣ Branches (الفروع)
```sql
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id),
  name text NOT NULL,
  address text,
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 4 فروع
- الفرع الرئيسي (الرياض)
- فرع جدة
- فرع الدمام
- فرع الخبر (للشركة الثانية)

---

### 3️⃣ Locations (المواقع)
```sql
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id),
  branch_id uuid REFERENCES branches(id),
  name text NOT NULL,
  address text,
  lat numeric,
  lng numeric,
  gps_radius integer DEFAULT 100,
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 7 مواقع
- المصنع الرئيسي
- المكتب الإداري
- المستودع
- القسم التقني
- مكتب جدة
- مكتب الدمام
- مكتب الخبر

**GPS Radius:** 100 متر (افتراضي)

---

### 4️⃣ Location Managers (مدراء المواقع)
```sql
CREATE TABLE public.location_managers (
  location_id uuid REFERENCES locations(id),
  user_id uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (location_id, user_id)
);
```

**البيانات الحالية:** 4 علاقات بين المدراء والمواقع

**العلاقة:** Many-to-Many (مدير واحد يمكن أن يدير عدة مواقع)

---

### 5️⃣ Users (المستخدمين)
```sql
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies(id),
  branch_id uuid REFERENCES branches(id),
  username text NOT NULL UNIQUE,
  email text UNIQUE,
  phone text UNIQUE,
  full_name text NOT NULL,
  avatar_url text,
  role user_role DEFAULT 'employee',
  notification_preferences jsonb DEFAULT '{"email": true, "whatsapp": true}',
  is_active boolean DEFAULT true,
  last_login_at timestamp with time zone,
  password text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

**البيانات الحالية:** 21 مستخدم

**الأدوار (Roles):**
- `super_admin`: 2 مستخدم
- `hr`: 2 مستخدم
- `manager`: 7 مستخدم
- `employee`: 10 مستخدم

**ملاحظة مهمة:**
- ⚠️ حقل `password` موجود في Schema لكن قيمته `null` في جميع السجلات
- ✅ النظام يستخدم localStorage بدلاً من Supabase Auth
- ✅ العلاقة مع `auth.users(id)` موجودة لكن غير مُفعّلة

---

### 6️⃣ Employees (الموظفين)
```sql
CREATE TABLE public.employees (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  employee_number text NOT NULL UNIQUE,
  location_id uuid REFERENCES locations(id),
  department text,
  position text,
  hire_date date NOT NULL,
  shift_id uuid REFERENCES shifts(id),
  vacation_balance integer DEFAULT 21,
  sick_leave_balance integer DEFAULT 15,
  face_encoding text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 10 موظفين

**الأرصدة الافتراضية:**
- إجازات سنوية: 21 يوم
- إجازات مرضية: 15 يوم

**Face Recognition:**
- حقل `face_encoding` موجود لتخزين بصمة الوجه
- حالياً: null (لم يتم تفعيله بعد)

---

### 7️⃣ Shifts (نوبات العمل)
```sql
CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id uuid REFERENCES locations(id),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_start time,
  break_duration integer DEFAULT 0,
  work_days jsonb DEFAULT '["sun", "mon", "tue", "wed", "thu"]',
  late_arrival_buffer integer DEFAULT 15,
  work_hours numeric,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 9 نوبات

**أيام العمل الافتراضية:** الأحد - الخميس
**متسامح التأخير:** 15 دقيقة

**أمثلة النوبات:**
- صباحية: 08:00 - 16:00
- مسائية: 16:00 - 00:00
- ليلية: 00:00 - 08:00

---

### 8️⃣ QR Codes (أكواد QR)
```sql
CREATE TABLE public.qr_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id uuid REFERENCES locations(id),
  code_data text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used_by uuid REFERENCES users(id),
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 0 (فارغ)

**RLS Status:** ❌ Disabled (تم تعطيله لدعم localStorage)

**Refresh Interval:** 120 ثانية (من company settings)

---

### 9️⃣ Color Codes (أكواد الألوان)
```sql
CREATE TABLE public.color_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id uuid REFERENCES locations(id),
  current_color text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 114 كود

**RLS Status:** ❌ Disabled (تم تعطيله لدعم localStorage)

**الألوان المتاحة:** red, green, blue, yellow
**Refresh Interval:** 20 ثانية (من company settings)

**آخر كود مُنشأ:**
- اللون: green
- الموقع: المكتب الإداري
- ينتهي: 2025-10-18T20:28:25

---

### 🔟 Numeric Codes (الأكواد الرقمية)
```sql
CREATE TABLE public.numeric_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id uuid REFERENCES locations(id),
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 23 كود

**RLS Status:** ❌ Disabled (تم تعطيله لدعم localStorage)

**عدد الأرقام:** 4 digits (من company settings)
**Refresh Interval:** 300 ثانية (5 دقائق)

---

### 1️⃣1️⃣ Attendance Records (سجلات الحضور)
```sql
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id),
  branch_id uuid REFERENCES branches(id),
  location_id uuid REFERENCES locations(id),
  employee_id uuid REFERENCES users(id),
  shift_id uuid REFERENCES shifts(id),
  check_in timestamp with time zone NOT NULL,
  check_out timestamp with time zone,
  expected_check_in timestamp with time zone,
  expected_check_out timestamp with time zone,
  method_used attendance_method NOT NULL,
  method_data jsonb DEFAULT '{}',
  gps_lat numeric,
  gps_lng numeric,
  gps_distance numeric,
  gps_accuracy numeric,
  selfie_url text,
  selfie_data jsonb DEFAULT '{}',
  suspicious_score integer DEFAULT 0,
  suspicious_reasons jsonb DEFAULT '[]',
  status record_status DEFAULT 'approved',
  verified_by uuid REFERENCES users(id),
  verified_at timestamp with time zone,
  late_minutes integer DEFAULT 0,
  work_hours numeric,
  overtime_hours numeric,
  device_info jsonb DEFAULT '{}',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 2 سجل

**RLS Status:** ❌ Disabled (تم تعطيله لدعم localStorage)

**طرق الحضور (method_used):**
- `qr` - QR Code
- `color` - Color Code (مُستخدم في السجلين)
- `numeric` - Numeric Code

**حالات السجل (status):**
- `pending` - في انتظار المراجعة
- `approved` - موافق عليه (الحالة الحالية)
- `rejected` - مرفوض

**السجلات الحالية:**
1. الموظفة: hind - check_in: 2025-10-18T20:28:11 - طريقة: color (green)
2. موظف آخر - check_in: 2025-10-18T20:34:52 - طريقة: color (green)

---

### 1️⃣2️⃣ Leave Requests (طلبات الإجازات)
```sql
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES users(id),
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL,
  reason text,
  status request_status DEFAULT 'pending',
  approved_by uuid REFERENCES users(id),
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 1 طلب

**أنواع الإجازات (leave_type):**
- `annual` - إجازة سنوية
- `sick` - إجازة مرضية
- `emergency` - إجازة طارئة
- `unpaid` - إجازة بدون راتب

**حالات الطلب (status):**
- `pending` - قيد المراجعة
- `approved` - موافق عليه
- `rejected` - مرفوض

---

### 1️⃣3️⃣ Custom Requests (الطلبات المخصصة)
```sql
CREATE TABLE public.custom_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES users(id),
  title text NOT NULL,
  description text NOT NULL,
  attachment_url text,
  status request_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamp with time zone,
  response text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 0 (فارغ)

**الاستخدام:** طلبات عامة من الموظفين (شهادة راتب، خطاب تعريف، إلخ)

---

### 1️⃣4️⃣ Verification Codes (أكواد التحقق)
```sql
CREATE TABLE public.verification_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  code text NOT NULL,
  type text NOT NULL,
  method text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  attempts integer DEFAULT 0,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 0 (فارغ)

**الاستخدام:** أكواد التحقق للمصادقة الثنائية (2FA)

---

### 1️⃣5️⃣ Verification Requests (طلبات التحقق)
```sql
CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_record_id uuid REFERENCES attendance_records(id),
  employee_id uuid REFERENCES users(id),
  manager_id uuid REFERENCES location_managers(user_id),
  suspicious_score integer NOT NULL,
  suspicious_reasons jsonb NOT NULL,
  status request_status DEFAULT 'pending',
  expires_at timestamp with time zone NOT NULL,
  resolved_at timestamp with time zone,
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**البيانات الحالية:** 0 (فارغ)

**الاستخدام:** عندما يتجاوز suspicious_score الحد المسموح (50)

---

## 🔐 Row Level Security (RLS) Status

| الجدول | RLS Status | السبب |
|--------|-----------|-------|
| **qr_codes** | ❌ Disabled | يحتاج المدراء لإنشاء أكواد بدون auth.uid() |
| **color_codes** | ❌ Disabled | يحتاج المدراء لإنشاء أكواد بدون auth.uid() |
| **numeric_codes** | ❌ Disabled | يحتاج المدراء لإنشاء أكواد بدون auth.uid() |
| **attendance_records** | ❌ Disabled | يحتاج الموظفون لتسجيل حضور بدون auth.uid() |
| **companies** | ✅ Enabled | محمي بـ RLS |
| **branches** | ✅ Enabled | محمي بـ RLS |
| **locations** | ✅ Enabled | محمي بـ RLS |
| **users** | ✅ Enabled | محمي بـ RLS |
| **employees** | ✅ Enabled | محمي بـ RLS |
| **shifts** | ✅ Enabled | محمي بـ RLS |
| **leave_requests** | ✅ Enabled | محمي بـ RLS |
| **custom_requests** | ✅ Enabled | محمي بـ RLS |

**السبب:** المشروع يستخدم localStorage للجلسات بدلاً من Supabase Auth

---

## 📐 العلاقات (Relationships)

```
companies (1)
  ├─ branches (N)
  │   └─ locations (N)
  │       ├─ location_managers (N:N with users)
  │       ├─ shifts (N)
  │       ├─ qr_codes (N)
  │       ├─ color_codes (N)
  │       └─ numeric_codes (N)
  │
  └─ users (N)
      ├─ employees (1:1)
      ├─ attendance_records (N)
      ├─ leave_requests (N)
      └─ custom_requests (N)
```

---

## 🎨 User-Defined Types

### user_role
```sql
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'hr',
  'manager',
  'employee'
);
```

### attendance_method
```sql
CREATE TYPE attendance_method AS ENUM (
  'qr',
  'color',
  'numeric'
);
```

### record_status
```sql
CREATE TYPE record_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);
```

### request_status
```sql
CREATE TYPE request_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);
```

### leave_type
```sql
CREATE TYPE leave_type AS ENUM (
  'annual',
  'sick',
  'emergency',
  'unpaid'
);
```

---

## 📊 إحصائيات البيانات الحالية

| الجدول | العدد | الحالة |
|--------|-------|--------|
| companies | 2 | ✅ |
| branches | 4 | ✅ |
| locations | 7 | ✅ |
| location_managers | 4 | ✅ |
| users | 21 | ✅ |
| employees | 10 | ✅ |
| shifts | 9 | ✅ |
| qr_codes | 0 | ⚠️ فارغ |
| color_codes | 114 | ✅ |
| numeric_codes | 23 | ✅ |
| attendance_records | 2 | ✅ |
| leave_requests | 1 | ✅ |
| custom_requests | 0 | ⚠️ فارغ |
| verification_codes | 0 | ⚠️ فارغ |
| verification_requests | 0 | ⚠️ فارغ |

**إجمالي السجلات:** 197

---

## 🔄 آخر تحديث

**التاريخ:** 2025-10-18
**المصدر:** Supabase Dashboard
**الحالة:** ✅ النظام يعمل بشكل صحيح
