// سكريبت للتحقق من بنية قاعدة البيانات وجداولها
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// تحميل متغيرات البيئة من ملف .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ خطأ: لم يتم العثور على متغيرات البيئة VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY');
  console.error('تأكد من وجود ملف .env في جذر المشروع');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 فحص بنية قاعدة البيانات...\n');

  const tables = [
    'companies',
    'branches',
    'locations',
    'shifts',
    'users',
    'employees',
    'location_managers',
    'attendance',
    'attendance_records',
    'leave_requests',
    'leave_balances'
  ];

  console.log('═'.repeat(80));
  console.log('📋 فحص الجداول');
  console.log('═'.repeat(80));

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: غير موجود أو لا يمكن الوصول إليه`);
        console.log(`   الخطأ: ${error.message}`);
      } else {
        console.log(`✅ ${table}: موجود (${count || 0} سجل)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: خطأ في الاتصال`);
    }
  }

  // محاولة اختبار INSERT على جدول companies
  console.log('\n' + '═'.repeat(80));
  console.log('🧪 اختبار INSERT على جدول companies');
  console.log('═'.repeat(80));

  try {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        id: 'test-company-id-123',
        name: 'شركة تجريبية',
        is_active: true
      })
      .select();

    if (error) {
      console.log('❌ فشل INSERT:');
      console.log(`   الخطأ: ${error.message}`);
      console.log(`   التفاصيل: ${JSON.stringify(error, null, 2)}`);
    } else {
      console.log('✅ نجح INSERT! البيانات:');
      console.log(JSON.stringify(data, null, 2));

      // حذف البيانات التجريبية
      await supabase
        .from('companies')
        .delete()
        .eq('id', 'test-company-id-123');
      console.log('🗑️ تم حذف البيانات التجريبية');
    }
  } catch (err) {
    console.log('❌ خطأ في الاختبار:', err);
  }
}

checkSchema();
