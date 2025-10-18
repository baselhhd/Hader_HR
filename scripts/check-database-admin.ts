/**
 * Script to check Supabase database connection and existing data (using service key)
 * Run with: npx tsx scripts/check-database-admin.ts
 */

import { supabaseAdmin as supabase } from './_env-config';

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database (Admin)...\n');

  try {
    // Check Companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError.message);
    } else {
      console.log(`✅ Companies: ${companies?.length || 0} records`);
      if (companies && companies.length > 0) {
        companies.forEach(c => {
          console.log(`   - ${c.name} (ID: ${c.id.substring(0, 8)}...)`);
        });
      }
    }

    // Check Branches
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('*');

    if (branchesError) {
      console.error('❌ Error fetching branches:', branchesError.message);
    } else {
      console.log(`\n✅ Branches: ${branches?.length || 0} records`);
      if (branches && branches.length > 0) {
        branches.forEach(b => {
          console.log(`   - ${b.name} (ID: ${b.id.substring(0, 8)}...)`);
        });
      }
    }

    // Check Locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*');

    if (locationsError) {
      console.error('❌ Error fetching locations:', locationsError.message);
    } else {
      console.log(`\n✅ Locations: ${locations?.length || 0} records`);
      if (locations && locations.length > 0) {
        locations.forEach(l => {
          console.log(`   - ${l.name} (ID: ${l.id.substring(0, 8)}...)`);
          console.log(`     GPS: ${l.lat}, ${l.lng} (radius: ${l.gps_radius}m)`);
        });
      }
    }

    // Check Users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, full_name, role, email');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
    } else {
      console.log(`\n✅ Users: ${users?.length || 0} records`);
      if (users && users.length > 0) {
        users.forEach(user => {
          console.log(`   - ${user.full_name} (@${user.username}) - ${user.role}`);
          console.log(`     Email: ${user.email}`);
        });
      }
    }

    // Check Employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('user_id, employee_number, department, position');

    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError.message);
    } else {
      console.log(`\n✅ Employees: ${employees?.length || 0} records`);
      if (employees && employees.length > 0) {
        employees.forEach(emp => {
          console.log(`   - ${emp.employee_number} - ${emp.position} (${emp.department})`);
        });
      }
    }

    // Check Shifts
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*');

    if (shiftsError) {
      console.error('❌ Error fetching shifts:', shiftsError.message);
    } else {
      console.log(`\n✅ Shifts: ${shifts?.length || 0} records`);
      if (shifts && shifts.length > 0) {
        shifts.forEach(s => {
          console.log(`   - ${s.name}: ${s.start_time} - ${s.end_time} (${s.work_hours}h)`);
        });
      }
    }

    // Check Attendance Records
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('id, check_in, check_out, method_used, status');

    if (attendanceError) {
      console.error('❌ Error fetching attendance:', attendanceError.message);
    } else {
      console.log(`\n✅ Attendance Records: ${attendance?.length || 0} records`);
      if (attendance && attendance.length > 0) {
        attendance.forEach(a => {
          const checkIn = new Date(a.check_in);
          const checkOut = a.check_out ? new Date(a.check_out) : null;
          console.log(`   - ${checkIn.toLocaleDateString('ar-SA')} ${checkIn.toLocaleTimeString('ar-SA')}`);
          if (checkOut) {
            console.log(`     Out: ${checkOut.toLocaleTimeString('ar-SA')}`);
          }
          console.log(`     Method: ${a.method_used}, Status: ${a.status}`);
        });
      }
    }

    // Check QR/Color/Numeric Codes
    const { data: qrCodes } = await supabase.from('qr_codes').select('id');
    const { data: colorCodes } = await supabase.from('color_codes').select('id');
    const { data: numericCodes } = await supabase.from('numeric_codes').select('id');

    console.log(`\n✅ QR Codes: ${qrCodes?.length || 0} records`);
    console.log(`✅ Color Codes: ${colorCodes?.length || 0} records`);
    console.log(`✅ Numeric Codes: ${numericCodes?.length || 0} records`);

    console.log('\n✅ Database check completed!\n');

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Unexpected error:', message);
  }
}

checkDatabase();
