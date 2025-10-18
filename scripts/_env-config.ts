/**
 * مساعد لتحميل متغيرات البيئة في السكريبتات
 * استخدم هذا في جميع السكريبتات بدلاً من كتابة المفاتيح بشكل ثابت
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/integrations/supabase/types';

// تحميل متغيرات البيئة
config();

// التحقق من وجود المتغيرات المطلوبة
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ خطأ: VITE_SUPABASE_URL غير موجود في ملف .env');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ خطأ: VITE_SUPABASE_ANON_KEY غير موجود في ملف .env');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ خطأ: VITE_SUPABASE_SERVICE_ROLE_KEY غير موجود في ملف .env');
  process.exit(1);
}

/**
 * Supabase client مع Anon Key (للاستخدام العام)
 */
export const supabaseAnon = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Supabase client مع Service Role Key (للاستخدام الإداري)
 * استخدم هذا فقط في السكريبتات التي تحتاج صلاحيات كاملة
 */
export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY
};
