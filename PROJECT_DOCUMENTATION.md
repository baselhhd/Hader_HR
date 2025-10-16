# 📋 وثائق مشروع Hader HR - نظام إدارة الموارد البشرية

## 📖 نظرة عامة

**Hader HR** هو نظام شامل لإدارة الموارد البشرية والحضور والانصراف، مبني باستخدام تقنيات حديثة ويدعم اللغة العربية بشكل كامل.

### 🎯 الأهداف الرئيسية
- إدارة حضور وانصراف الموظفين بطرق متعددة
- إدارة طلبات الإجازات
- نظام تقارير شامل مع إمكانية التصدير
- إدارة متعددة المستويات (شركات، فروع، مواقع)
- دعم GPS للتحقق من الموقع

---

## 🏗️ البنية التقنية

### التقنيات المستخدمة
- **Frontend Framework**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Authentication)
- **UI Components**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Toast Notifications**: Sonner
- **Date Handling**: Native JavaScript Date API

### هيكل المشروع
```
src/
├── pages/
│   ├── employee/       # صفحات الموظف
│   ├── manager/        # صفحات مدير الموقع
│   ├── hr/            # صفحات الموارد البشرية
│   └── admin/         # صفحات المدير العام
├── components/
│   └── ui/            # مكونات UI قابلة لإعادة الاستخدام
└── integrations/
    └── supabase/      # تكامل Supabase
```

---

## 👥 أدوار المستخدمين

### 1. الموظف (Employee)
**المسار**: `/employee/dashboard`

**الصلاحيات**:
- تسجيل الحضور والانصراف
- عرض سجل الحضور الشخصي
- تقديم طلبات الإجازات
- عرض الملف الشخصي

**الصفحات الرئيسية**:
- `EmployeeDashboard.tsx` - لوحة التحكم
- `CheckIn.tsx` - تسجيل الحضور (QR, Color, Numeric)
- `AttendanceHistory.tsx` - سجل الحضور
- `LeaveRequest.tsx` - طلبات الإجازات
- `Profile.tsx` - الملف الشخصي

### 2. مدير الموقع (Location Manager)
**المسار**: `/manager/dashboard`

**الصلاحيات**:
- مراجعة والموافقة على طلبات الحضور
- إدارة الموقع المخصص له
- عرض تقارير الموقع

**الصفحات الرئيسية**:
- `ManagerDashboard.tsx` - لوحة التحكم
- `VerificationRequests.tsx` - طلبات التحقق

### 3. الموارد البشرية (HR Admin)
**المسار**: `/hr/dashboard`

**الصلاحيات**:
- إدارة جميع الموظفين
- مراجعة والموافقة على طلبات الإجازات
- عرض سجلات الحضور لجميع الموظفين
- إنشاء وتصدير التقارير

**الصفحات الرئيسية**:
- `HRDashboard.tsx` - لوحة التحكم
- `Employees.tsx` - إدارة الموظفين
- `LeaveRequests.tsx` - إدارة طلبات الإجازات
- `Attendance.tsx` - سجلات الحضور
- `Reports.tsx` - التقارير والإحصائيات

### 4. المدير العام (Super Admin)
**المسار**: `/admin/dashboard`

**الصلاحيات**:
- إدارة كاملة للنظام
- إدارة الشركات والفروع
- إدارة المواقع والورديات
- إدارة المستخدمين والأدوار
- إعدادات النظام

**الصفحات الرئيسية**:
- `AdminDashboard.tsx` - لوحة التحكم
- `Companies.tsx` - إدارة الشركات
- `Branches.tsx` - إدارة الفروع
- `Locations.tsx` - إدارة المواقع
- `Shifts.tsx` - إدارة الورديات
- `Users.tsx` - إدارة المستخدمين
- `Settings.tsx` - إعدادات النظام

---

## 🔑 الميزات الرئيسية

### 1. نظام الحضور المتعدد
الموظفون يمكنهم تسجيل الحضور بثلاث طرق:

#### أ. رمز QR (QR Code)
- يتم عرض رمز QR فريد لكل موقع
- يتم مسح الرمز لتسجيل الحضور
- **الملف**: `CheckIn.tsx`

#### ب. كود اللون (Color Code)
- يتم عرض لون محدد في الموقع
- الموظف يختار اللون المطابق
- **الملف**: `CheckIn.tsx`

#### ج. الكود الرقمي (Numeric Code)
- يتم عرض كود رقمي من 4 أرقام
- الموظف يدخل الكود
- **الملف**: `CheckIn.tsx`

### 2. التحقق من الموقع (GPS)
- التحقق من أن الموظف في نطاق الموقع المسموح
- نطاق GPS قابل للتخصيص (افتراضي: 100 متر)
- **الملف**: `Locations.tsx`
- **الوظيفة**: `handleGetCurrentLocation()`

```typescript
const handleGetCurrentLocation = () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        });
        toast.success("تم الحصول على الموقع الحالي");
      },
      (error) => {
        toast.error("فشل الحصول على الموقع الحالي");
      }
    );
  }
};
```

### 3. إدارة الورديات
- إنشاء ورديات مخصصة
- تحديد أوقات البداية والنهاية
- حساب تلقائي لعدد ساعات العمل
- **الملف**: `Shifts.tsx`
- **الوظيفة**: `calculateWorkHours()`

```typescript
const calculateWorkHours = (start: string, end: string): number => {
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  let hours = endHour - startHour;
  let minutes = endMin - startMin;

  if (minutes < 0) {
    hours--;
    minutes += 60;
  }

  return hours + minutes / 60;
};
```

### 4. نظام التقارير المتقدم
التقارير المتاحة:
- **تقرير الحضور والانصراف**: جميع سجلات الحضور
- **تقرير الإجازات**: طلبات الإجازات وحالاتها
- **تقرير الأداء**: إحصائيات الحضور لكل موظف
- **تقرير الأقسام**: توزيع الموظفين حسب الأدوار

**التصدير**:
- تصدير إلى CSV مع ترميز عربي صحيح (BOM)
- إمكانية تصدير جميع التقارير دفعة واحدة
- **الملف**: `Reports.tsx`
- **الوظيفة**: `handleExportReport()`

```typescript
// Create CSV with BOM for proper Arabic encoding
const BOM = "\uFEFF";
const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
```

### 5. إدارة المستخدمين
- إضافة مستخدمين جدد
- تعيين الأدوار (Employee, Location Manager, HR Admin, Super Admin)
- تعديل البيانات
- حذف المستخدمين
- إنشاء تلقائي للبريد الإلكتروني الداخلي
- **الملف**: `Users.tsx`

### 6. إعدادات النظام الشاملة
صفحة إعدادات متقدمة تتضمن:

#### الإعدادات العامة
- اسم الشركة

#### إعدادات ساعات العمل
- وقت بداية العمل
- وقت نهاية العمل
- عدد ساعات العمل الافتراضية
- حد التأخير المسموح (بالدقائق)

#### إعدادات المصادقة
- تفعيل/تعطيل المصادقة بـ QR
- تفعيل/تعطيل المصادقة بكود اللون
- تفعيل/تعطيل المصادقة بالكود الرقمي

#### إعدادات GPS
- طلب التحقق من الموقع
- نطاق GPS المسموح (بالمتر)

#### إعدادات سلوك النظام
- تفعيل الإشعارات
- الموافقة التلقائية على الحضور

**الملف**: `Settings.tsx`

---

## 🗄️ قاعدة البيانات (Supabase)

### الجداول الرئيسية

#### 1. `users`
```sql
- id (uuid, PK)
- username (text)
- full_name (text)
- email (text)
- phone (text)
- password (text)
- role (text) -- employee, loc_manager, hr_admin, super_admin
- created_at (timestamp)
- last_login_at (timestamp)
```

#### 2. `companies`
```sql
- id (uuid, PK)
- name (text)
- description (text)
- created_at (timestamp)
```

#### 3. `branches`
```sql
- id (uuid, PK)
- company_id (uuid, FK -> companies)
- name (text)
- address (text)
- created_at (timestamp)
```

#### 4. `locations`
```sql
- id (uuid, PK)
- branch_id (uuid, FK -> branches)
- name (text)
- lat (numeric)
- lng (numeric)
- gps_radius (integer)
- created_at (timestamp)
```

#### 5. `shifts`
```sql
- id (uuid, PK)
- name (text)
- start_time (time)
- end_time (time)
- work_hours (numeric)
- created_at (timestamp)
```

#### 6. `attendance_records`
```sql
- id (uuid, PK)
- user_id (uuid, FK -> users)
- location_id (uuid, FK -> locations)
- check_in (timestamp)
- check_out (timestamp)
- method_used (text) -- qr, color, numeric
- status (text) -- pending, approved, rejected
- created_at (timestamp)
```

#### 7. `leave_requests`
```sql
- id (uuid, PK)
- user_id (uuid, FK -> users)
- start_date (date)
- end_date (date)
- reason (text)
- status (text) -- pending, approved, rejected
- created_at (timestamp)
```

#### 8. `employees`
```sql
- id (uuid, PK)
- user_id (uuid, FK -> users)
- employee_id (text)
- department (text)
- position (text)
- hire_date (date)
- created_at (timestamp)
```

---

## 🎨 التصميم والواجهة

### نظام الألوان
كل دور له نظام ألوان مميز:

- **Employee**: أخضر (`from-green-50 to-emerald-100`)
- **Location Manager**: أزرق فاتح (`from-cyan-50 to-blue-100`)
- **HR Admin**: أزرق (`from-blue-50 to-indigo-100`)
- **Super Admin**: بنفسجي-وردي (`from-purple-50 to-pink-100`)

### المكونات المشتركة
جميع الصفحات تستخدم مكونات shadcn/ui:
- `Card` - بطاقات العرض
- `Button` - أزرار
- `Input` - حقول الإدخال
- `Dialog` - نوافذ منبثقة
- `Table` - جداول
- `Badge` - شارات الحالة
- `Select` - قوائم منسدلة
- `Switch` - مفاتيح تبديل

### دعم RTL (Right-to-Left)
جميع الصفحات تدعم الاتجاه من اليمين لليسار:
```tsx
<div dir="rtl">
  {/* المحتوى */}
</div>
```

---

## 🔐 الأمان والصلاحيات

### المصادقة (Authentication)
- نظام تسجيل دخول عبر Supabase Auth
- تخزين الجلسة في localStorage
- التحقق من الدور عند الدخول لكل صفحة

### مثال على التحقق من الصلاحيات
```typescript
const fetchUserInfo = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "super_admin") {
      toast.error("غير مصرح لك بالدخول لهذه الصفحة");
      navigate("/login");
      return;
    }
  }
};
```

### RLS (Row Level Security)
يجب تفعيل سياسات RLS على جميع الجداول في Supabase لضمان أن كل مستخدم يمكنه الوصول فقط للبيانات المسموح له بها.

---

## 📊 قائمة بجميع الصفحات والمسارات

### صفحات عامة
| المسار | الصفحة | الوصف |
|-------|--------|-------|
| `/` | Index.tsx | الصفحة الرئيسية |
| `/login` | Login.tsx | تسجيل الدخول |

### صفحات الموظف
| المسار | الصفحة | الوصف |
|-------|--------|-------|
| `/employee/dashboard` | EmployeeDashboard.tsx | لوحة التحكم |
| `/employee/check-in` | CheckIn.tsx | تسجيل الحضور |
| `/employee/attendance` | AttendanceHistory.tsx | سجل الحضور |
| `/employee/leave-request` | LeaveRequest.tsx | طلبات الإجازات |
| `/employee/profile` | Profile.tsx | الملف الشخصي |

### صفحات مدير الموقع
| المسار | الصفحة | الوصف |
|-------|--------|-------|
| `/manager/dashboard` | ManagerDashboard.tsx | لوحة التحكم |
| `/manager/verifications` | VerificationRequests.tsx | طلبات التحقق |

### صفحات الموارد البشرية
| المسار | الصفحة | الوصف |
|-------|--------|-------|
| `/hr/dashboard` | HRDashboard.tsx | لوحة التحكم |
| `/hr/employees` | Employees.tsx | إدارة الموظفين |
| `/hr/requests` | LeaveRequests.tsx | طلبات الإجازات |
| `/hr/reports` | Reports.tsx | التقارير |
| `/hr/attendance` | Attendance.tsx | سجلات الحضور |

### صفحات المدير العام
| المسار | الصفحة | الوصف |
|-------|--------|-------|
| `/admin/dashboard` | AdminDashboard.tsx | لوحة التحكم |
| `/admin/companies` | Companies.tsx | إدارة الشركات |
| `/admin/branches` | Branches.tsx | إدارة الفروع |
| `/admin/locations` | Locations.tsx | إدارة المواقع |
| `/admin/shifts` | Shifts.tsx | إدارة الورديات |
| `/admin/users` | Users.tsx | إدارة المستخدمين |
| `/admin/settings` | Settings.tsx | إعدادات النظام |

---

## 🚀 التشغيل والتطوير

### المتطلبات
- Node.js 18+
- npm أو yarn
- حساب Supabase

### خطوات التشغيل

1. **تثبيت الاعتماديات**:
```bash
npm install
```

2. **إعداد Supabase**:
   - أنشئ مشروع جديد في Supabase
   - انسخ URL و API Key
   - أنشئ الجداول المطلوبة
   - فعّل RLS policies

3. **تشغيل المشروع**:
```bash
npm run dev
```

4. **الوصول للتطبيق**:
   - افتح المتصفح على `http://localhost:8080`

### بناء للإنتاج
```bash
npm run build
```

---

## 🧪 الاختبار

### قائمة الاختبارات المطلوبة

#### اختبارات الموظف
- [ ] تسجيل الدخول كموظف
- [ ] تسجيل الحضور بـ QR Code
- [ ] تسجيل الحضور بـ Color Code
- [ ] تسجيل الحضور بـ Numeric Code
- [ ] عرض سجل الحضور الشخصي
- [ ] تقديم طلب إجازة
- [ ] عرض الملف الشخصي

#### اختبارات مدير الموقع
- [ ] تسجيل الدخول كمدير موقع
- [ ] عرض طلبات التحقق
- [ ] الموافقة على طلب
- [ ] رفض طلب

#### اختبارات الموارد البشرية
- [ ] تسجيل الدخول كـ HR
- [ ] عرض جميع الموظفين
- [ ] عرض سجلات الحضور
- [ ] البحث والتصفية
- [ ] مراجعة طلبات الإجازات
- [ ] تصدير التقارير إلى CSV

#### اختبارات المدير العام
- [ ] تسجيل الدخول كمدير عام
- [ ] إضافة شركة جديدة
- [ ] إضافة فرع جديد
- [ ] إضافة موقع مع GPS
- [ ] إضافة وردية جديدة
- [ ] إضافة مستخدم جديد
- [ ] تعديل إعدادات النظام
- [ ] حفظ الإعدادات

---

## 🐛 المشاكل الشائعة والحلول

### 1. خطأ "غير مصرح لك بالدخول"
**السبب**: دور المستخدم لا يتطابق مع الصفحة المطلوبة
**الحل**: تأكد من أن المستخدم لديه الدور الصحيح في جدول `users`

### 2. لا تظهر البيانات في الجداول
**السبب**: سياسات RLS تمنع الوصول
**الحل**: تحقق من سياسات RLS في Supabase وتأكد من السماح بالقراءة

### 3. خطأ في التصدير إلى CSV
**السبب**: بيانات فارغة أو خطأ في الاستعلام
**الحل**: افتح Console وتحقق من الأخطاء، تأكد من وجود بيانات

### 4. GPS لا يعمل
**السبب**: المتصفح لا يدعم Geolocation أو الأذونات مرفوضة
**الحل**: تأكد من السماح بالوصول للموقع في إعدادات المتصفح

---

## 📈 التحسينات المستقبلية

### قصيرة المدى
- [ ] إضافة Pagination للجداول الكبيرة
- [ ] تحسين الأداء مع React.memo
- [ ] إضافة Loading Skeletons
- [ ] تحسين رسائل الأخطاء

### متوسطة المدى
- [ ] إضافة Dashboard Charts (مخططات بيانية)
- [ ] نظام الإشعارات الفعلي
- [ ] تصدير إلى Excel بدلاً من CSV
- [ ] نظام البحث المتقدم

### طويلة المدى
- [ ] تطبيق موبايل (React Native)
- [ ] نظام الرسائل الداخلية
- [ ] تقارير مخصصة
- [ ] تكامل مع أنظمة خارجية (HR systems)

---

## 👨‍💻 الصيانة والدعم

### تحديث الاعتماديات
```bash
npm update
```

### فحص الأخطاء
```bash
npm run build
```

### التحقق من TypeScript
```bash
npx tsc --noEmit
```

---

## 📝 ملاحظات مهمة

1. **الأمان**: لا تشارك مفاتيح Supabase في الكود المصدري
2. **النسخ الاحتياطي**: احتفظ بنسخة احتياطية من قاعدة البيانات بشكل دوري
3. **الاختبار**: اختبر جميع الميزات قبل النشر للإنتاج
4. **الأداء**: راقب أداء الاستعلامات وقم بتحسينها عند الحاجة
5. **التوثيق**: حدّث هذه الوثائق عند إضافة ميزات جديدة

---

## 📞 الدعم

في حالة وجود أي مشاكل أو استفسارات:
1. راجع هذه الوثائق أولاً
2. تحقق من سجلات Console في المتصفح
3. راجع سجلات Supabase
4. تواصل مع فريق التطوير

---

## ©️ الحقوق

**Hader HR System** © 2025
جميع الحقوق محفوظة

---

تم التحديث في: ${new Date().toLocaleDateString('ar-SA')}
الإصدار: 1.0.0
