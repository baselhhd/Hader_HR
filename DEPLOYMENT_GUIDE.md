# 🚀 دليل النشر - Hader HR System

## نظرة عامة

هذا الدليل يوضح كيفية نشر نظام Hader HR إلى الإنتاج باستخدام عدة منصات مختلفة.

---

## 📋 المتطلبات الأساسية قبل النشر

### 1. التحقق من البيئة المحلية
```bash
# تأكد من أن المشروع يعمل بدون أخطاء
npm run build

# تشغيل معاينة البناء
npm run preview
```

### 2. متغيرات البيئة
تأكد من إعداد ملف `.env` بالقيم الصحيحة:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **تحذير**: لا ترفع ملف `.env` إلى Git. تأكد من وجوده في `.gitignore`

### 3. قاعدة البيانات (Supabase)
- تأكد من إنشاء جميع الجداول المطلوبة
- تفعيل Row Level Security (RLS) policies
- إنشاء Indexes للأداء
- إعداد Auth settings

---

## 🌐 خيارات النشر

### الخيار 1: النشر على Vercel (موصى به)

#### المزايا
- ✅ نشر سريع ومجاني
- ✅ SSL تلقائي
- ✅ CDN عالمي
- ✅ تكامل مع Git
- ✅ معاينة تلقائية للـ Pull Requests

#### الخطوات

1. **تثبيت Vercel CLI**
```bash
npm i -g vercel
```

2. **تسجيل الدخول**
```bash
vercel login
```

3. **النشر**
```bash
# للنشر الأول
vercel

# للنشر إلى الإنتاج
vercel --prod
```

4. **إعداد متغيرات البيئة في Vercel**
   - افتح لوحة تحكم Vercel
   - اذهب إلى Settings > Environment Variables
   - أضف:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

5. **إعداد Domain مخصص (اختياري)**
   - Settings > Domains
   - أضف domain الخاص بك

#### ملف `vercel.json` (اختياري)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### الخيار 2: النشر على Netlify

#### الخطوات

1. **تثبيت Netlify CLI**
```bash
npm i -g netlify-cli
```

2. **تسجيل الدخول**
```bash
netlify login
```

3. **النشر**
```bash
# بناء المشروع
npm run build

# النشر
netlify deploy --prod
```

4. **إعداد متغيرات البيئة**
   - Site settings > Build & deploy > Environment
   - أضف المتغيرات المطلوبة

#### ملف `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### الخيار 3: النشر على GitHub Pages

#### الخطوات

1. **تثبيت gh-pages**
```bash
npm install --save-dev gh-pages
```

2. **تحديث `package.json`**
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://username.github.io/repository-name"
}
```

3. **تحديث `vite.config.ts`**
```typescript
export default defineConfig({
  base: '/repository-name/',
  // ... rest of config
})
```

4. **النشر**
```bash
npm run deploy
```

---

### الخيار 4: النشر على خادم VPS (Linux)

#### المتطلبات
- خادم Linux (Ubuntu/Debian)
- Nginx أو Apache
- Node.js 18+
- SSL Certificate (Let's Encrypt)

#### الخطوات

1. **تحديث النظام**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **تثبيت Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **تثبيت Nginx**
```bash
sudo apt install nginx -y
```

4. **رفع المشروع للخادم**
```bash
# على جهازك المحلي
npm run build

# رفع dist folder للخادم
scp -r dist/* user@server:/var/www/haderhr
```

5. **إعداد Nginx**

إنشاء ملف `/etc/nginx/sites-available/haderhr`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/haderhr;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

6. **تفعيل الموقع**
```bash
sudo ln -s /etc/nginx/sites-available/haderhr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

7. **إضافة SSL (Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔒 الأمان

### 1. تأمين متغيرات البيئة
- لا ترفع `.env` إلى Git
- استخدم أسرار المنصة (Platform Secrets)
- قم بتدوير المفاتيح بشكل دوري

### 2. Row Level Security (RLS)
تأكد من تفعيل RLS على جميع الجداول في Supabase:

```sql
-- مثال على users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Super admins can read all"
ON users FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'super_admin'
  )
);
```

### 3. HTTPS
- استخدم SSL دائماً في الإنتاج
- Vercel و Netlify يوفرون SSL تلقائياً
- للـ VPS: استخدم Let's Encrypt

---

## 📊 المراقبة والأداء

### 1. تفعيل Analytics
```typescript
// في src/main.tsx أو App.tsx
if (import.meta.env.PROD) {
  // Google Analytics, Plausible, أو أي أداة أخرى
}
```

### 2. Sentry للأخطاء (اختياري)
```bash
npm install @sentry/react
```

```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "your-sentry-dsn",
    environment: "production",
  });
}
```

### 3. Performance Monitoring
- استخدم Lighthouse للتحقق من الأداء
- راقب Bundle Size
- استخدم Code Splitting

---

## 🔄 التحديثات والصيانة

### 1. استراتيجية النشر
```bash
# Development
git checkout develop
# ... make changes
git push

# Staging
git checkout staging
git merge develop
git push  # يتم النشر تلقائياً إلى Staging

# Production
git checkout main
git merge staging
git push  # يتم النشر تلقائياً إلى Production
```

### 2. Rollback
إذا حدث خطأ:

**على Vercel:**
- اذهب إلى Deployments
- اختر نشر سابق
- اضغط "Promote to Production"

**على Netlify:**
- Deploys > اختر النشر السابق
- "Publish deploy"

**على VPS:**
```bash
# احتفظ بنسخة احتياطية دائماً
cp -r /var/www/haderhr /var/www/haderhr.backup

# للرجوع
rm -rf /var/www/haderhr
mv /var/www/haderhr.backup /var/www/haderhr
```

---

## ✅ قائمة التحقق قبل النشر

- [ ] جميع الاختبارات تعمل
- [ ] لا توجد أخطاء في Console
- [ ] متغيرات البيئة محددة بشكل صحيح
- [ ] RLS مفعل على جميع الجداول
- [ ] SSL مفعل
- [ ] Domain محدد
- [ ] Analytics مفعل (اختياري)
- [ ] Error tracking مفعل (اختياري)
- [ ] نسخة احتياطية من قاعدة البيانات
- [ ] Documentation محدثة
- [ ] Performance tested
- [ ] Mobile responsive tested
- [ ] RTL (Arabic) tested

---

## 🆘 حل المشاكل الشائعة

### 1. 404 على الروابط المباشرة
**السبب**: تكوين خاطئ للـ Server

**الحل**:
- **Vercel/Netlify**: سيتم حله تلقائياً
- **Nginx**: تأكد من `try_files $uri $uri/ /index.html;`

### 2. متغيرات البيئة لا تعمل
**السبب**: متغيرات البيئة غير محددة في المنصة

**الحل**:
- تأكد من إضافة جميع المتغيرات في إعدادات المنصة
- أعد النشر بعد إضافة المتغيرات

### 3. أداء بطيء
**الحل**:
```bash
# تحقق من حجم الـ Bundle
npm run build -- --report

# استخدم Code Splitting
# استخدم Lazy Loading للمكونات الكبيرة
```

### 4. خطأ CORS من Supabase
**الحل**:
- تحقق من URL في Supabase Dashboard
- أضف Domain الخاص بك في Supabase > Settings > API

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. راجع هذا الدليل
2. تحقق من logs المنصة
3. راجع [التوثيق الكامل](./PROJECT_DOCUMENTATION.md)
4. تواصل مع فريق التطوير

---

## 📝 ملاحظات إضافية

### البيئات المتعددة
يمكنك إنشاء بيئات متعددة:

- **Development**: `https://dev.haderhr.com`
- **Staging**: `https://staging.haderhr.com`
- **Production**: `https://haderhr.com`

كل بيئة تستخدم Supabase Project منفصل.

### CI/CD التلقائي
معظم المنصات توفر CI/CD تلقائي:
- Push إلى `main` → نشر إلى Production
- Push إلى `develop` → نشر إلى Staging
- Pull Request → معاينة تلقائية

---

## 🎉 النهاية

مبروك! مشروعك الآن جاهز للنشر. تأكد من:
1. اختبار جميع الميزات
2. مراقبة الأداء
3. الاحتفاظ بنسخ احتياطية
4. تحديث الوثائق

**تم التحديث**: ${new Date().toLocaleDateString('ar-SA')}
**الإصدار**: 1.0.0
