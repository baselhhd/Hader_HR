// سكريبت شامل لجلب جميع بيانات قاعدة البيانات من Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ccqfviqftfbywlobyjev.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcWZ2aXFmdGZieXdsb2J5amV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0Mzk5ODEsImV4cCI6MjA3NjAxNTk4MX0.tjSaWUXor9GZVza1bSygNfGl0DVIRB9p5LKscSyBC9U';

const supabase = createClient(supabaseUrl, supabaseKey);

// دالة مساعدة لطباعة الجداول
function printTable(title, data, headers = null) {
  console.log('\n' + '='.repeat(100));
  console.log(`📋 ${title}`);
  console.log('='.repeat(100));

  if (!data || data.length === 0) {
    console.log('❌ لا توجد بيانات في هذا الجدول');
    return;
  }

  console.log(`✅ عدد السجلات: ${data.length}\n`);

  data.forEach((item, index) => {
    console.log(`\n📌 السجل #${index + 1}:`);
    console.log('─'.repeat(100));

    Object.entries(item).forEach(([key, value]) => {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        console.log(`   ${key}: [Object]`);
      } else if (Array.isArray(value)) {
        console.log(`   ${key}: [Array with ${value.length} items]`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });
  });
}

async function fetchAllData() {
  console.log('\n🚀 بدء جلب جميع بيانات قاعدة البيانات من Supabase...\n');

  const allData = {
    companies: null,
    branches: null,
    locations: null,
    shifts: null,
    users: null,
    employees: null,
    location_managers: null,
    attendance: null,
    leave_requests: null,
    leave_balances: null
  };

  try {
    // 1. جلب الشركات
    console.log('📦 جلب بيانات الشركات...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: true });

    if (companiesError) {
      console.error('❌ خطأ في جلب الشركات:', companiesError.message);
    } else {
      allData.companies = companies;
      console.log(`✅ تم جلب ${companies.length} شركة`);
    }

    // 2. جلب الفروع
    console.log('📦 جلب بيانات الفروع...');
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select(`
        *,
        company:companies(name)
      `)
      .order('created_at', { ascending: true });

    if (branchesError) {
      console.error('❌ خطأ في جلب الفروع:', branchesError.message);
    } else {
      allData.branches = branches;
      console.log(`✅ تم جلب ${branches.length} فرع`);
    }

    // 3. جلب المواقع
    console.log('📦 جلب بيانات المواقع...');
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select(`
        *,
        company:companies(name),
        branch:branches(name)
      `)
      .order('created_at', { ascending: true });

    if (locationsError) {
      console.error('❌ خطأ في جلب المواقع:', locationsError.message);
    } else {
      allData.locations = locations;
      console.log(`✅ تم جلب ${locations.length} موقع`);
    }

    // 4. جلب الورديات
    console.log('📦 جلب بيانات الورديات...');
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select(`
        *,
        location:locations(name)
      `)
      .order('created_at', { ascending: true });

    if (shiftsError) {
      console.error('❌ خطأ في جلب الورديات:', shiftsError.message);
    } else {
      allData.shifts = shifts;
      console.log(`✅ تم جلب ${shifts.length} وردية`);
    }

    // 5. جلب المستخدمين
    console.log('📦 جلب بيانات المستخدمين...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        *,
        company:companies(name),
        branch:branches(name)
      `)
      .order('created_at', { ascending: true });

    if (usersError) {
      console.error('❌ خطأ في جلب المستخدمين:', usersError.message);
    } else {
      allData.users = users;
      console.log(`✅ تم جلب ${users.length} مستخدم`);
    }

    // 6. جلب الموظفين
    console.log('📦 جلب بيانات الموظفين...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select(`
        *,
        user:users(username, full_name, email),
        location:locations(name),
        shift:shifts(name, start_time, end_time)
      `)
      .order('created_at', { ascending: true });

    if (employeesError) {
      console.error('❌ خطأ في جلب الموظفين:', employeesError.message);
    } else {
      allData.employees = employees;
      console.log(`✅ تم جلب ${employees.length} موظف`);
    }

    // 7. جلب مدراء المواقع
    console.log('📦 جلب بيانات مدراء المواقع...');
    const { data: locationManagers, error: locationManagersError } = await supabase
      .from('location_managers')
      .select(`
        *,
        location:locations(name),
        user:users(username, full_name, email)
      `)
      .order('created_at', { ascending: true });

    if (locationManagersError) {
      console.error('❌ خطأ في جلب مدراء المواقع:', locationManagersError.message);
    } else {
      allData.location_managers = locationManagers;
      console.log(`✅ تم جلب ${locationManagers.length} مدير موقع`);
    }

    // 8. جلب سجلات الحضور
    console.log('📦 جلب بيانات الحضور...');
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        *,
        user:users(username, full_name),
        location:locations(name),
        shift:shifts(name, start_time, end_time)
      `)
      .order('date', { ascending: false })
      .limit(50); // نأخذ آخر 50 سجل حضور

    if (attendanceError) {
      console.error('❌ خطأ في جلب الحضور:', attendanceError.message);
    } else {
      allData.attendance = attendance;
      console.log(`✅ تم جلب ${attendance.length} سجل حضور`);
    }

    // 9. جلب طلبات الإجازات
    console.log('📦 جلب بيانات طلبات الإجازات...');
    const { data: leaveRequests, error: leaveRequestsError } = await supabase
      .from('leave_requests')
      .select(`
        *,
        user:users(username, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (leaveRequestsError) {
      console.error('❌ خطأ في جلب طلبات الإجازات:', leaveRequestsError.message);
    } else {
      allData.leave_requests = leaveRequests;
      console.log(`✅ تم جلب ${leaveRequests.length} طلب إجازة`);
    }

    // 10. جلب أرصدة الإجازات
    console.log('📦 جلب بيانات أرصدة الإجازات...');
    const { data: leaveBalances, error: leaveBalancesError } = await supabase
      .from('leave_balances')
      .select(`
        *,
        user:users(username, full_name)
      `)
      .order('created_at', { ascending: true });

    if (leaveBalancesError) {
      console.error('❌ خطأ في جلب أرصدة الإجازات:', leaveBalancesError.message);
    } else {
      allData.leave_balances = leaveBalances;
      console.log(`✅ تم جلب ${leaveBalances.length} رصيد إجازة`);
    }

    // طباعة البيانات
    console.log('\n\n' + '█'.repeat(100));
    console.log('📊 عرض جميع بيانات قاعدة البيانات');
    console.log('█'.repeat(100));

    printTable('🏢 الشركات (Companies)', allData.companies);
    printTable('🏪 الفروع (Branches)', allData.branches);
    printTable('📍 المواقع (Locations)', allData.locations);
    printTable('⏰ الورديات (Shifts)', allData.shifts);
    printTable('👥 المستخدمين (Users)', allData.users);
    printTable('👷 الموظفين (Employees)', allData.employees);
    printTable('👨‍💼 مدراء المواقع (Location Managers)', allData.location_managers);
    printTable('📅 سجلات الحضور (Attendance - آخر 50)', allData.attendance);
    printTable('🏖️ طلبات الإجازات (Leave Requests - آخر 50)', allData.leave_requests);
    printTable('📊 أرصدة الإجازات (Leave Balances)', allData.leave_balances);

    // إحصائيات شاملة
    console.log('\n\n' + '█'.repeat(100));
    console.log('📈 إحصائيات شاملة لقاعدة البيانات');
    console.log('█'.repeat(100));
    console.log(`\n🏢 الشركات: ${allData.companies?.length || 0}`);
    console.log(`🏪 الفروع: ${allData.branches?.length || 0}`);
    console.log(`📍 المواقع: ${allData.locations?.length || 0}`);
    console.log(`⏰ الورديات: ${allData.shifts?.length || 0}`);
    console.log(`👥 المستخدمين: ${allData.users?.length || 0}`);
    console.log(`👷 الموظفين: ${allData.employees?.length || 0}`);
    console.log(`👨‍💼 مدراء المواقع: ${allData.location_managers?.length || 0}`);
    console.log(`📅 سجلات الحضور: ${allData.attendance?.length || 0} (من الأحدث)`);
    console.log(`🏖️ طلبات الإجازات: ${allData.leave_requests?.length || 0} (من الأحدث)`);
    console.log(`📊 أرصدة الإجازات: ${allData.leave_balances?.length || 0}`);

    // تحليل المشاكل
    console.log('\n\n' + '█'.repeat(100));
    console.log('⚠️ تحليل المشاكل المحتملة');
    console.log('█'.repeat(100));

    const issues = [];

    // التحقق من الشركات
    if (!allData.companies || allData.companies.length === 0) {
      issues.push('❌ لا توجد شركات في قاعدة البيانات');
    }

    // التحقق من الفروع
    if (!allData.branches || allData.branches.length === 0) {
      issues.push('❌ لا توجد فروع في قاعدة البيانات');
    }

    // التحقق من المواقع
    if (!allData.locations || allData.locations.length === 0) {
      issues.push('❌ لا توجد مواقع في قاعدة البيانات');
    }

    // التحقق من الورديات
    if (!allData.shifts || allData.shifts.length === 0) {
      issues.push('❌ لا توجد ورديات في قاعدة البيانات');
    }

    // التحقق من المستخدمين بدون company_id
    if (allData.users) {
      const usersWithoutCompany = allData.users.filter(u => !u.company_id);
      if (usersWithoutCompany.length > 0) {
        issues.push(`⚠️ ${usersWithoutCompany.length} مستخدم بدون شركة مرتبطة`);
      }
    }

    // التحقق من المستخدمين بدون email
    if (allData.users) {
      const usersWithoutEmail = allData.users.filter(u => !u.email);
      if (usersWithoutEmail.length > 0) {
        issues.push(`⚠️ ${usersWithoutEmail.length} مستخدم بدون بريد إلكتروني`);
      }
    }

    // التحقق من الموظفين
    if (allData.users && allData.employees) {
      const employeeUsers = allData.users.filter(u => u.role === 'employee');
      if (employeeUsers.length > allData.employees.length) {
        issues.push(`⚠️ ${employeeUsers.length - allData.employees.length} مستخدم بصلاحية employee بدون بيانات موظف في جدول employees`);
      }
    }

    // التحقق من مدراء المواقع
    if (allData.users && allData.location_managers) {
      const managerUsers = allData.users.filter(u => u.role === 'loc_manager');
      if (managerUsers.length > allData.location_managers.length) {
        issues.push(`⚠️ ${managerUsers.length - allData.location_managers.length} مدير موقع غير مرتبط بموقع محدد`);
      }
    }

    if (issues.length === 0) {
      console.log('\n✅ لا توجد مشاكل واضحة في قاعدة البيانات');
    } else {
      console.log('\n🔍 تم اكتشاف المشاكل التالية:\n');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    // حفظ البيانات في ملف JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database_snapshot_${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`\n💾 تم حفظ نسخة كاملة من البيانات في: ${filename}`);

    console.log('\n' + '█'.repeat(100));
    console.log('✅ تم الانتهاء من جلب وتحليل جميع البيانات');
    console.log('█'.repeat(100) + '\n');

  } catch (error) {
    console.error('\n❌ خطأ عام:', error);
  }
}

// تشغيل الدالة
fetchAllData();
