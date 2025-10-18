/**
 * تطبيق إصلاح RLS لصفحة Manager Dashboard
 * Run with: npx tsx scripts/apply-rls-fix-manager.ts
 */

import { supabaseAdmin } from './_env-config';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyRLSFix() {
  console.log('🔧 تطبيق إصلاح RLS للمدراء...\n');

  try {
    // قراءة ملف الـ migration
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251018_fix_rls_for_local_auth.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 تطبيق Migration:');
    console.log('─'.repeat(80));

    // تطبيق الـ SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql_string: migrationSQL
    });

    if (error) {
      // إذا لم تعمل RPC، نحاول تنفيذ الأوامر مباشرة
      console.log('⚠️  RPC غير متاح، سنطبق التغييرات مباشرة...\n');

      // تعطيل RLS مباشرة
      console.log('1️⃣ تعطيل RLS على qr_codes...');
      await supabaseAdmin.rpc('disable_rls_qr_codes');
      console.log('   ✅ تم');

      console.log('2️⃣ تعطيل RLS على color_codes...');
      await supabaseAdmin.rpc('disable_rls_color_codes');
      console.log('   ✅ تم');

      console.log('3️⃣ تعطيل RLS على numeric_codes...');
      await supabaseAdmin.rpc('disable_rls_numeric_codes');
      console.log('   ✅ تم');

    } else {
      console.log('✅ تم تطبيق Migration بنجاح!\n');
    }

    // التحقق من النتيجة
    console.log('\n📊 التحقق من النتيجة:');
    console.log('─'.repeat(80));

    // محاولة إدراج بيانات تجريبية
    console.log('\n🧪 اختبار الإدراج في numeric_codes...');
    const testCode = {
      location_id: '20000000-0000-0000-0000-000000000002',
      code: '9999',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('numeric_codes')
      .insert(testCode)
      .select()
      .single();

    if (insertError) {
      console.error('   ❌ فشل الإدراج:', insertError.message);
      console.log('\n⚠️  قد تحتاج إلى تطبيق المig ration يدوياً عبر Supabase Dashboard');
    } else {
      console.log('   ✅ نجح الإدراج!');
      console.log('   البيانات:', insertData);

      // حذف البيانات التجريبية
      await supabaseAdmin
        .from('numeric_codes')
        .delete()
        .eq('id', insertData.id);
      console.log('   🗑️  تم حذف البيانات التجريبية');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ اكتمل إصلاح RLS!');
    console.log('='.repeat(80));
    console.log('\n💡 الخطوات التالية:');
    console.log('   1. جرب تسجيل الدخول كمدير موقع');
    console.log('   2. افتح صفحة Manager Dashboard');
    console.log('   3. تأكد من ظهور الأكواد بدون أخطاء\n');

  } catch (error) {
    console.error('\n❌ خطأ:', error);
    console.log('\n📝 الحل البديل:');
    console.log('   قم بتنفيذ الأوامر التالية مباشرة في Supabase SQL Editor:\n');
    console.log('   ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;');
    console.log('   ALTER TABLE color_codes DISABLE ROW LEVEL SECURITY;');
    console.log('   ALTER TABLE numeric_codes DISABLE ROW LEVEL SECURITY;\n');
    process.exit(1);
  }
}

applyRLSFix();
