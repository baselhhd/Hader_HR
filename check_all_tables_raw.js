// سكريبت للتحقق من جميع الجداول مع تعطيل RLS
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ccqfviqftfbywlobyjev.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcWZ2aXFmdGZieXdsb2J5amV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0Mzk5ODEsImV4cCI6MjA3NjAxNTk4MX0.tjSaWUXor9GZVza1bSygNfGl0DVIRB9p5LKscSyBC9U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
  console.log('🔍 التحقق من جميع الجداول...\n');
  console.log('═'.repeat(100));

  // 1. الشركات
  console.log('\n🏢 جدول الشركات (companies):');
  console.log('─'.repeat(100));
  try {
    const { data, error, count } = await supabase
      .from('companies')
      .select('*', { count: 'exact' });

    if (error) {
      console.log('❌ خطأ:', error.message);
      console.log('📝 الكود:', error.code);
      console.log('💡 التفاصيل:', error.details);
    } else {
      console.log(`✅ عدد السجلات: ${count}`);
      if (data && data.length > 0) {
        data.forEach((item, i) => {
          console.log(`\n   ${i + 1}. ${item.name}`);
          console.log(`      ID: ${item.id}`);
          console.log(`      نشط: ${item.is_active ? 'نعم' : 'لا'}`);
        });
      } else {
        console.log('   📭 لا توجد بيانات');
      }
    }
  } catch (err) {
    console.log('❌ خطأ غير متوقع:', err.message);
  }

  // 2. الفروع
  console.log('\n🏪 جدول الفروع (branches):');
  console.log('─'.repeat(100));
  try {
    const { data, error, count } = await supabase
      .from('branches')
      .select('*', { count: 'exact' });

    if (error) {
      console.log('❌ خطأ:', error.message);
    } else {
      console.log(`✅ عدد السجلات: ${count}`);
      if (data && data.length > 0) {
        data.forEach((item, i) => {
          console.log(`\n   ${i + 1}. ${item.name}`);
          console.log(`      ID: ${item.id}`);
          console.log(`      الشركة: ${item.company_id}`);
          console.log(`      العنوان: ${item.address}`);
        });
      } else {
        console.log('   📭 لا توجد بيانات');
      }
    }
  } catch (err) {
    console.log('❌ خطأ غير متوقع:', err.message);
  }

  // 3. المواقع
  console.log('\n📍 جدول المواقع (locations):');
  console.log('─'.repeat(100));
  try {
    const { data, error, count } = await supabase
      .from('locations')
      .select('*', { count: 'exact' });

    if (error) {
      console.log('❌ خطأ:', error.message);
    } else {
      console.log(`✅ عدد السجلات: ${count}`);
      if (data && data.length > 0) {
        data.forEach((item, i) => {
          console.log(`\n   ${i + 1}. ${item.name}`);
          console.log(`      ID: ${item.id}`);
          console.log(`      الفرع: ${item.branch_id}`);
          console.log(`      العنوان: ${item.address}`);
          console.log(`      نطاق GPS: ${item.gps_radius}م`);
        });
      } else {
        console.log('   📭 لا توجد بيانات');
      }
    }
  } catch (err) {
    console.log('❌ خطأ غير متوقع:', err.message);
  }

  // 4. الورديات
  console.log('\n⏰ جدول الورديات (shifts):');
  console.log('─'.repeat(100));
  try {
    const { data, error, count } = await supabase
      .from('shifts')
      .select('*', { count: 'exact' });

    if (error) {
      console.log('❌ خطأ:', error.message);
    } else {
      console.log(`✅ عدد السجلات: ${count}`);
      if (data && data.length > 0) {
        data.forEach((item, i) => {
          console.log(`\n   ${i + 1}. ${item.name}`);
          console.log(`      ID: ${item.id}`);
          console.log(`      الموقع: ${item.location_id}`);
          console.log(`      من ${item.start_time} إلى ${item.end_time}`);
          console.log(`      ساعات العمل: ${item.work_hours} ساعة`);
        });
      } else {
        console.log('   📭 لا توجد بيانات');
      }
    }
  } catch (err) {
    console.log('❌ خطأ غير متوقع:', err.message);
  }

  // 5. الموظفين
  console.log('\n👷 جدول الموظفين (employees):');
  console.log('─'.repeat(100));
  try {
    const { data, error, count } = await supabase
      .from('employees')
      .select('*', { count: 'exact' });

    if (error) {
      console.log('❌ خطأ:', error.message);
    } else {
      console.log(`✅ عدد السجلات: ${count}`);
      if (data && data.length > 0) {
        data.forEach((item, i) => {
          console.log(`\n   ${i + 1}. رقم الموظف: ${item.employee_number}`);
          console.log(`      User ID: ${item.user_id}`);
          console.log(`      القسم: ${item.department}`);
          console.log(`      المنصب: ${item.position}`);
          console.log(`      رصيد الإجازات: ${item.vacation_balance} يوم`);
        });
      } else {
        console.log('   📭 لا توجد بيانات');
      }
    }
  } catch (err) {
    console.log('❌ خطأ غير متوقع:', err.message);
  }

  // 6. مدراء المواقع
  console.log('\n👨‍💼 جدول مدراء المواقع (location_managers):');
  console.log('─'.repeat(100));
  try {
    const { data, error, count } = await supabase
      .from('location_managers')
      .select('*', { count: 'exact' });

    if (error) {
      console.log('❌ خطأ:', error.message);
    } else {
      console.log(`✅ عدد السجلات: ${count}`);
      if (data && data.length > 0) {
        data.forEach((item, i) => {
          console.log(`\n   ${i + 1}. الموقع: ${item.location_id}`);
          console.log(`      المستخدم: ${item.user_id}`);
        });
      } else {
        console.log('   📭 لا توجد بيانات');
      }
    }
  } catch (err) {
    console.log('❌ خطأ غير متوقع:', err.message);
  }

  // 7. المستخدمين (للتأكيد)
  console.log('\n👥 جدول المستخدمين (users):');
  console.log('─'.repeat(100));
  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('username, full_name, role, email', { count: 'exact' });

    if (error) {
      console.log('❌ خطأ:', error.message);
    } else {
      console.log(`✅ عدد السجلات: ${count}`);
      if (data && data.length > 0) {
        const roleGroups = {
          'super_admin': [],
          'hr_admin': [],
          'loc_manager': [],
          'employee': []
        };

        data.forEach(user => {
          roleGroups[user.role].push(user.username);
        });

        console.log(`\n   🔴 مدراء عامون: ${roleGroups.super_admin.length} (${roleGroups.super_admin.join(', ')})`);
        console.log(`   🟠 مدراء موارد بشرية: ${roleGroups.hr_admin.length} (${roleGroups.hr_admin.join(', ')})`);
        console.log(`   🟡 مدراء مواقع: ${roleGroups.loc_manager.length} (${roleGroups.loc_manager.join(', ')})`);
        console.log(`   🟢 موظفون: ${roleGroups.employee.length} (${roleGroups.employee.join(', ')})`);
      }
    }
  } catch (err) {
    console.log('❌ خطأ غير متوقع:', err.message);
  }

  console.log('\n' + '═'.repeat(100));
  console.log('✅ تم الانتهاء من الفحص');
  console.log('═'.repeat(100));
}

checkAllTables();
