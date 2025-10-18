/**
 * Script to seed the database with test data
 * Run with: npx tsx scripts/seed-database.ts
 */

import { supabaseAdmin as supabase } from './_env-config';

/**
 * توليد email داخلي من username
 */
function generateInternalEmail(username: string): string {
  const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '_');
  return `${cleanUsername}@internal.hader.local`;
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Create Company
    console.log('📊 Creating company...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'شركة الأمل للتكنولوجيا',
        settings: {
          attendance_methods: {
            qr_code: { enabled: true, refresh_interval: 120, priority: 1 },
            color: { enabled: true, refresh_interval: 20, colors: ["red", "green", "blue", "yellow"], priority: 2 },
            code: { enabled: true, refresh_interval: 300, digits: 4, priority: 3 }
          },
          verification: {
            gps: { enabled: true, required: true, radius: 100 },
            selfie: { mode: "on_suspicion", face_recognition: false, liveness_detection: false }
          },
          suspicion: {
            enabled: true,
            gps_out_range: 40,
            unusual_time: 15,
            different_pattern: 10,
            previous_suspicious: 20,
            threshold: 50,
            verification_timeout: 20
          }
        }
      })
      .select()
      .single();

    if (companyError) throw companyError;
    console.log('✅ Company created:', company.name);

    // 2. Create Branch
    console.log('\n📍 Creating branch...');
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert({
        company_id: company.id,
        name: 'الفرع الرئيسي',
        address: 'الرياض، حي العليا'
      })
      .select()
      .single();

    if (branchError) throw branchError;
    console.log('✅ Branch created:', branch.name);

    // 3. Create Location
    console.log('\n🗺️ Creating location...');
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
        company_id: company.id,
        branch_id: branch.id,
        name: 'المكتب الرئيسي',
        address: 'الرياض، حي العليا، شارع التحلية',
        lat: 24.7136, // Riyadh coordinates
        lng: 46.6753,
        gps_radius: 100
      })
      .select()
      .single();

    if (locationError) throw locationError;
    console.log('✅ Location created:', location.name);

    // 4. Create Shift
    console.log('\n⏰ Creating shift...');
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .insert({
        location_id: location.id,
        name: 'الوردية الصباحية',
        start_time: '08:00:00',
        end_time: '16:00:00',
        break_start: '12:00:00',
        break_duration: 60,
        work_days: ["sun", "mon", "tue", "wed", "thu"],
        late_arrival_buffer: 15,
        work_hours: 8
      })
      .select()
      .single();

    if (shiftError) throw shiftError;
    console.log('✅ Shift created:', shift.name);

    // 5. Create Users (using Supabase Auth)
    console.log('\n👥 Creating users...');

    // Employee User - check if exists first
    let employeeUserId: string;
    const employeeUsername = 'ahmed_ali';
    const employeeInternalEmail = generateInternalEmail(employeeUsername);

    const { data: existingEmployeeAuth } = await supabase.auth.admin.listUsers();
    const existingEmployee = existingEmployeeAuth.users.find(u => u.email === employeeInternalEmail);

    if (existingEmployee) {
      console.log('ℹ️  Employee auth already exists, using existing user');
      employeeUserId = existingEmployee.id;
    } else {
      const { data: employeeAuth, error: employeeAuthError } = await supabase.auth.admin.createUser({
        email: employeeInternalEmail, // Email داخلي مُولد
        password: 'Test123!',
        email_confirm: true
      });

      if (employeeAuthError) throw employeeAuthError;
      employeeUserId = employeeAuth.user.id;
      console.log(`✅ Employee auth created with internal email: ${employeeInternalEmail}`);
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', employeeUserId)
      .maybeSingle();

    let employeeProfile: typeof existingProfile;
    if (existingProfile) {
      console.log('ℹ️  Employee profile already exists, updating...');
      const { data, error } = await supabase
        .from('users')
        .update({
          company_id: company.id,
          branch_id: branch.id
        })
        .eq('id', employeeUserId)
        .select()
        .single();

      if (error) throw error;
      employeeProfile = data;
    } else {
      // Insert employee profile
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: employeeUserId,
          company_id: company.id,
          branch_id: branch.id,
          username: employeeUsername,
          email: null, // Email حقيقي غير موجود (سيضيفه المستخدم لاحقاً من البروفايل)
          phone: '+966501234567',
          full_name: 'أحمد علي محمد',
          role: 'employee'
        })
        .select()
        .single();

      if (error) throw error;
      employeeProfile = data;
      console.log('✅ Employee profile created:', employeeProfile.full_name);
      console.log('   📧 Email: داخلي (يمكن تحديثه من البروفايل)');
      console.log('   📱 Phone: +966501234567');
    }

    // Check if employee data exists
    const { data: existingEmpData } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', employeeUserId)
      .maybeSingle();

    if (existingEmpData) {
      console.log('ℹ️  Employee data already exists, updating...');
      await supabase
        .from('employees')
        .update({
          location_id: location.id,
          shift_id: shift.id
        })
        .eq('user_id', employeeUserId);
    } else {
      // Insert employee data
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .insert({
          user_id: employeeUserId,
          employee_number: 'EMP001',
          location_id: location.id,
          shift_id: shift.id,
          department: 'تقنية المعلومات',
          position: 'مطور برمجيات',
          hire_date: '2024-01-01',
          vacation_balance: 21,
          sick_leave_balance: 10
        })
        .select()
        .single();

      if (employeeError) throw employeeError;
      console.log('✅ Employee data created:', employee.employee_number);
    }

    // Manager User - check if exists first
    let managerUserId: string;
    const managerUsername = 'khaled_manager';
    const managerInternalEmail = generateInternalEmail(managerUsername);
    const existingManager = existingEmployeeAuth.users.find(u => u.email === managerInternalEmail);

    if (existingManager) {
      console.log('ℹ️  Manager auth already exists, using existing user');
      managerUserId = existingManager.id;
    } else {
      const { data: managerAuth, error: managerAuthError } = await supabase.auth.admin.createUser({
        email: managerInternalEmail, // Email داخلي مُولد
        password: 'Test123!',
        email_confirm: true
      });

      if (managerAuthError) throw managerAuthError;
      managerUserId = managerAuth.user.id;
      console.log(`✅ Manager auth created with internal email: ${managerInternalEmail}`);
    }

    // Check if profile exists
    const { data: existingManagerProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', managerUserId)
      .maybeSingle();

    if (!existingManagerProfile) {
      const { data: managerProfile, error: managerProfileError } = await supabase
        .from('users')
        .insert({
          id: managerUserId,
          company_id: company.id,
          branch_id: branch.id,
          username: managerUsername,
          email: 'khaled@company.com', // Email حقيقي كمثال
          phone: '+966507654321',
          full_name: 'خالد المدير',
          role: 'loc_manager'
        })
        .select()
        .single();

      if (managerProfileError) throw managerProfileError;
      console.log('✅ Manager profile created:', managerProfile.full_name);
      console.log('   📧 Email: khaled@company.com (حقيقي)');
      console.log('   📱 Phone: +966507654321');
    } else {
      console.log('ℹ️  Manager profile already exists');
    }

    // Assign manager to location
    const { data: existingLocManager } = await supabase
      .from('location_managers')
      .select('*')
      .eq('user_id', managerUserId)
      .eq('location_id', location.id)
      .maybeSingle();

    if (!existingLocManager) {
      const { error: locManagerError } = await supabase
        .from('location_managers')
        .insert({
          location_id: location.id,
          user_id: managerUserId
        });

      if (locManagerError) throw locManagerError;
      console.log('✅ Manager assigned to location');
    } else {
      console.log('ℹ️  Manager already assigned to location');
    }

    // HR Admin User - check if exists first
    let hrUserId: string;
    const hrUsername = 'fatima_hr';
    const hrInternalEmail = generateInternalEmail(hrUsername);
    const existingHR = existingEmployeeAuth.users.find(u => u.email === hrInternalEmail);

    if (existingHR) {
      console.log('ℹ️  HR auth already exists, using existing user');
      hrUserId = existingHR.id;
    } else {
      const { data: hrAuth, error: hrAuthError } = await supabase.auth.admin.createUser({
        email: hrInternalEmail, // Email داخلي مُولد
        password: 'Test123!',
        email_confirm: true
      });

      if (hrAuthError) throw hrAuthError;
      hrUserId = hrAuth.user.id;
      console.log(`✅ HR auth created with internal email: ${hrInternalEmail}`);
    }

    // Check if profile exists
    const { data: existingHRProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', hrUserId)
      .maybeSingle();

    if (!existingHRProfile) {
      const { data: hrProfile, error: hrProfileError } = await supabase
        .from('users')
        .insert({
          id: hrUserId,
          company_id: company.id,
          branch_id: branch.id,
          username: hrUsername,
          email: null, // Email حقيقي غير موجود (اختياري)
          phone: null, // رقم جوال غير موجود (اختياري)
          full_name: 'فاطمة الموارد البشرية',
          role: 'hr_admin'
        })
        .select()
        .single();

      if (hrProfileError) throw hrProfileError;
      console.log('✅ HR profile created:', hrProfile.full_name);
      console.log('   📧 Email: داخلي (غير محدث)');
      console.log('   📱 Phone: غير محدد');
    } else {
      console.log('ℹ️  HR profile already exists');
    }

    // 6. Create some QR codes, color codes, numeric codes
    console.log('\n🔐 Creating attendance codes...');

    // QR Code
    const { error: qrError } = await supabase
      .from('qr_codes')
      .insert({
        location_id: location.id,
        code_data: JSON.stringify({ locationId: location.id, timestamp: Date.now() }),
        expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutes
      });

    if (qrError) throw qrError;
    console.log('✅ QR code created');

    // Color Code
    const { error: colorError } = await supabase
      .from('color_codes')
      .insert({
        location_id: location.id,
        current_color: 'red',
        expires_at: new Date(Date.now() + 20 * 1000).toISOString() // 20 seconds
      });

    if (colorError) throw colorError;
    console.log('✅ Color code created');

    // Numeric Code
    const { error: numericError } = await supabase
      .from('numeric_codes')
      .insert({
        location_id: location.id,
        code: '1234',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      });

    if (numericError) throw numericError;
    console.log('✅ Numeric code created');

    // 7. Create sample attendance record
    console.log('\n📝 Creating sample attendance record...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(8, 15, 0, 0);

    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .insert({
        company_id: company.id,
        branch_id: branch.id,
        location_id: location.id,
        employee_id: employeeUserId,
        shift_id: shift.id,
        check_in: yesterday.toISOString(),
        check_out: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000).toISOString(),
        method_used: 'qr',
        status: 'approved',
        late_minutes: 15,
        work_hours: 8
      });

    if (attendanceError) throw attendanceError;
    console.log('✅ Sample attendance record created');

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📝 Test Accounts Created (Username / Password):');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 👤 Employee:  ahmed_ali / Test123!                         │');
    console.log('│    📧 Email: داخلي (يمكن تحديثه من البروفايل)             │');
    console.log('│    📱 Phone: +966501234567                                  │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ 👔 Manager:   khaled_manager / Test123!                    │');
    console.log('│    📧 Email: khaled@company.com (حقيقي)                    │');
    console.log('│    📱 Phone: +966507654321                                  │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ 💼 HR Admin:  fatima_hr / Test123!                         │');
    console.log('│    📧 Email: داخلي (غير محدث)                             │');
    console.log('│    📱 Phone: غير محدد                                      │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log('\n💡 ملاحظات:');
    console.log('   • تسجيل الدخول باستخدام Username + Password فقط');
    console.log('   • Email و Phone اختياريين ويمكن تحديثهما من البروفايل');
    console.log('   • Email الداخلي بصيغة: {username}@internal.hader.local');
    console.log('   • يمكن تحديث Email من داخلي إلى حقيقي في أي وقت\n');

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error seeding database:', message);
    console.error(error);
  }
}

seedDatabase();
