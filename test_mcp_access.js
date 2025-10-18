// اختبار الوصول إلى جميع جداول Supabase
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

async function testMCPAccess() {
  console.log('🧪 اختبار الوصول إلى Supabase MCP\n');
  console.log('═'.repeat(80));

  const results = {
    readable: [],
    notReadable: [],
    errors: []
  };

  const tables = [
    'users',
    'companies',
    'branches',
    'locations',
    'shifts',
    'employees',
    'location_managers',
    'attendance',
    'vacations',
    'salary_payments',
    'notifications'
  ];

  for (const table of tables) {
    console.log(`\n📋 اختبار جدول: ${table}`);
    console.log('─'.repeat(80));

    try {
      // محاولة القراءة
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        console.log(`❌ خطأ في القراءة: ${error.message}`);
        results.notReadable.push({ table, error: error.message, code: error.code });
      } else {
        console.log(`✅ قراءة ناجحة - عدد السجلات: ${count}`);
        if (data && data.length > 0) {
          console.log(`📊 أعمدة الجدول: ${Object.keys(data[0]).join(', ')}`);
        }
        results.readable.push({
          table,
          count,
          columns: data && data.length > 0 ? Object.keys(data[0]) : []
        });
      }

      // اختبار الكتابة (insert test - سيفشل بسبب RLS)
      const testData = { test: true };
      const { error: insertError } = await supabase
        .from(table)
        .insert([testData])
        .select();

      if (insertError) {
        console.log(`🔒 الكتابة محظورة: ${insertError.message}`);
      } else {
        console.log(`✍️ الكتابة متاحة`);
      }

    } catch (err) {
      console.log(`❌ خطأ غير متوقع: ${err.message}`);
      results.errors.push({ table, error: err.message });
    }
  }

  // ملخص النتائج
  console.log('\n' + '═'.repeat(80));
  console.log('📊 ملخص نتائج الاختبار');
  console.log('═'.repeat(80));

  console.log(`\n✅ الجداول القابلة للقراءة (${results.readable.length}):`);
  results.readable.forEach(({ table, count, columns }) => {
    console.log(`   - ${table}: ${count} سجل, ${columns.length} عمود`);
  });

  console.log(`\n❌ الجداول غير القابلة للقراءة (${results.notReadable.length}):`);
  results.notReadable.forEach(({ table, error }) => {
    console.log(`   - ${table}: ${error}`);
  });

  if (results.errors.length > 0) {
    console.log(`\n⚠️ أخطاء غير متوقعة (${results.errors.length}):`);
    results.errors.forEach(({ table, error }) => {
      console.log(`   - ${table}: ${error}`);
    });
  }

  // اختبار وظائف إضافية
  console.log('\n' + '═'.repeat(80));
  console.log('🔍 اختبار الوظائف المتقدمة');
  console.log('═'.repeat(80));

  // 1. اختبار الفلترة
  console.log('\n1️⃣ اختبار الفلترة (filter):');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username, role')
      .eq('role', 'super_admin');

    if (error) {
      console.log(`   ❌ فشل: ${error.message}`);
    } else {
      console.log(`   ✅ نجح - عثر على ${data.length} مدير عام`);
    }
  } catch (err) {
    console.log(`   ❌ خطأ: ${err.message}`);
  }

  // 2. اختبار الترتيب
  console.log('\n2️⃣ اختبار الترتيب (order):');
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('employee_number, vacation_balance')
      .order('vacation_balance', { ascending: false })
      .limit(3);

    if (error) {
      console.log(`   ❌ فشل: ${error.message}`);
    } else {
      console.log(`   ✅ نجح - أعلى 3 أرصدة إجازات:`);
      data.forEach(emp => {
        console.log(`      ${emp.employee_number}: ${emp.vacation_balance} يوم`);
      });
    }
  } catch (err) {
    console.log(`   ❌ خطأ: ${err.message}`);
  }

  // 3. اختبار الانضمام (join)
  console.log('\n3️⃣ اختبار الانضمام (join):');
  try {
    const { data, error } = await supabase
      .from('branches')
      .select(`
        name,
        companies (
          name
        )
      `)
      .limit(2);

    if (error) {
      console.log(`   ❌ فشل: ${error.message}`);
    } else {
      console.log(`   ✅ نجح - نتائج الانضمام:`);
      data.forEach(branch => {
        console.log(`      ${branch.name} <- ${branch.companies?.name || 'N/A'}`);
      });
    }
  } catch (err) {
    console.log(`   ❌ خطأ: ${err.message}`);
  }

  // 4. اختبار البحث النصي
  console.log('\n4️⃣ اختبار البحث النصي (textSearch):');
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('name, address')
      .ilike('name', '%مستودع%');

    if (error) {
      console.log(`   ❌ فشل: ${error.message}`);
    } else {
      console.log(`   ✅ نجح - عثر على ${data.length} موقع يحتوي على "مستودع"`);
    }
  } catch (err) {
    console.log(`   ❌ خطأ: ${err.message}`);
  }

  // 5. اختبار العد المجمع
  console.log('\n5️⃣ اختبار العد المجمع (aggregate count):');
  try {
    const { count, error } = await supabase
      .from('shifts')
      .select('*', { count: 'exact', head: true })
      .gte('work_hours', 8);

    if (error) {
      console.log(`   ❌ فشل: ${error.message}`);
    } else {
      console.log(`   ✅ نجح - عدد الورديات 8 ساعات أو أكثر: ${count}`);
    }
  } catch (err) {
    console.log(`   ❌ خطأ: ${err.message}`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('✅ انتهى الاختبار');
  console.log('═'.repeat(80));
}

testMCPAccess();
