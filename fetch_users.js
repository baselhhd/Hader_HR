// سكريبت لجلب بيانات المستخدمين من Supabase
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

async function fetchAllUsers() {
  console.log('🔍 جاري الاتصال بقاعدة البيانات...\n');

  try {
    // جلب جميع المستخدمين مع معلوماتهم
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        *,
        company:companies(name),
        branch:branches(name),
        employee:employees(*)
      `)
      .order('created_at', { ascending: true });

    if (usersError) {
      console.error('❌ خطأ في جلب المستخدمين:', usersError);
      return;
    }

    console.log(`✅ تم جلب ${users.length} مستخدم من قاعدة البيانات\n`);
    console.log('=' .repeat(80));

    users.forEach((user, index) => {
      console.log(`\n👤 المستخدم #${index + 1}`);
      console.log('─'.repeat(80));
      console.log(`📧 البريد الإلكتروني: ${user.email}`);
      console.log(`👤 اسم المستخدم: ${user.username}`);
      console.log(`📝 الاسم الكامل: ${user.full_name}`);
      console.log(`📱 الهاتف: ${user.phone || 'غير محدد'}`);
      console.log(`🎭 الصلاحية: ${user.role}`);
      console.log(`🏢 الشركة: ${user.company?.name || 'غير محدد'}`);
      console.log(`🏪 الفرع: ${user.branch?.name || 'غير محدد'}`);
      console.log(`✅ نشط: ${user.is_active ? 'نعم' : 'لا'}`);
      console.log(`📅 تاريخ الإنشاء: ${new Date(user.created_at).toLocaleDateString('ar-SA')}`);

      if (user.employee) {
        console.log(`\n   📋 بيانات الموظف:`);
        console.log(`   🔢 رقم الموظف: ${user.employee.employee_number}`);
        console.log(`   🏢 القسم: ${user.employee.department || 'غير محدد'}`);
        console.log(`   💼 المسمى الوظيفي: ${user.employee.position || 'غير محدد'}`);
        console.log(`   📅 تاريخ التعيين: ${user.employee.hire_date ? new Date(user.employee.hire_date).toLocaleDateString('ar-SA') : 'غير محدد'}`);
        console.log(`   🏖️ رصيد الإجازات: ${user.employee.vacation_balance || 0} يوم`);
        console.log(`   🤒 رصيد الإجازات المرضية: ${user.employee.sick_leave_balance || 0} يوم`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 إجمالي المستخدمين: ${users.length}`);

    // إحصائيات حسب الصلاحيات
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📈 إحصائيات حسب الصلاحيات:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل الدالة
fetchAllUsers();
