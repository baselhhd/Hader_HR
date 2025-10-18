# 🚀 دليل نشر مشروع Hader HR على Vercel

## 📋 المتطلبات الأساسية

### 1. حساب Supabase
- قم بإنشاء مشروع جديد على [Supabase](https://supabase.com)
- احصل على بيانات المشروع من لوحة التحكم

### 2. حساب Vercel
- قم بإنشاء حساب على [Vercel](https://vercel.com)
- ربط حسابك مع GitHub

---

## 🔑 البيانات المطلوبة للـ Deployment

### من لوحة تحكم Supabase:

#### 1. **Project Settings → API**
احصل على:
- **Project URL**: `https://[your-project-id].supabase.co`
- **Project ID**: `your-project-id`
- **anon public key**: المفتاح العام (آمن للاستخدام في المتصفح)
- **service_role secret**: المفتاح السري (استخدام محدود)

#### 2. **Account → Access Tokens**
- قم بإنشاء **Personal Access Token** جديد
- احفظه لاستخدامه في `VITE_SUPABASE_ACCESS_TOKEN`

---

## 🌐 خطوات النشر على Vercel

### الطريقة 1: عبر GitHub (الموصى بها)

#### 1. رفع المشروع إلى GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. استيراد المشروع في Vercel
1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اضغط **"New Project"**
3. اختر المستودع من GitHub
4. اضغط **"Import"**

#### 3. تكوين Environment Variables
في صفحة الإعدادات، أضف المتغيرات التالية:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
VITE_SUPABASE_ACCESS_TOKEN=your-access-token
```

#### 4. إعدادات البناء
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

#### 5. النشر
اضغط **"Deploy"**

---

## 📝 قائمة التحقق

### ✅ جاهز للنشر
- [x] Build يعمل محلياً
- [x] لا توجد أخطاء ESLint
- [x] ملف .env.example موجود
- [x] ملف vercel.json موجود
- [x] استقلالية البيانات مطبقة

---

## 🐛 حل المشاكل

### Build fails
```bash
npm run build  # اختبر محلياً
```

### Environment Variables
- تأكد أن جميع المتغيرات تبدأ بـ `VITE_`

### 404 على الصفحات
- ملف `vercel.json` موجود ويحل المشكلة

---

## ✨ بعد النشر

- الموقع متاح على: `https://your-project.vercel.app`
- HTTPS مفعل تلقائياً
- Auto deployments مفعل
