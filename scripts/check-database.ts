/**
 * Script to check Supabase database connection and existing data
 * Run with: npx tsx scripts/check-database.ts
 */

import { supabaseAnon as supabase } from './_env-config';

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database Connection...\n');

  try {
    // Check Companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(5);

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError.message);
    } else {
      console.log(`✅ Companies: ${companies?.length || 0} records`);
      if (companies && companies.length > 0) {
        console.log('   First company:', companies[0].name);
      }
    }

    // Check Branches
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('*')
      .limit(5);

    if (branchesError) {
      console.error('❌ Error fetching branches:', branchesError.message);
    } else {
      console.log(`✅ Branches: ${branches?.length || 0} records`);
      if (branches && branches.length > 0) {
        console.log('   First branch:', branches[0].name);
      }
    }

    // Check Locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .limit(5);

    if (locationsError) {
      console.error('❌ Error fetching locations:', locationsError.message);
    } else {
      console.log(`✅ Locations: ${locations?.length || 0} records`);
      if (locations && locations.length > 0) {
        console.log('   First location:', locations[0].name);
      }
    }

    // Check Users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, full_name, role')
      .limit(5);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
    } else {
      console.log(`✅ Users: ${users?.length || 0} records`);
      if (users && users.length > 0) {
        users.forEach(user => {
          console.log(`   - ${user.full_name} (${user.username}) - ${user.role}`);
        });
      }
    }

    // Check Employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('user_id, employee_number')
      .limit(5);

    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError.message);
    } else {
      console.log(`✅ Employees: ${employees?.length || 0} records`);
    }

    // Check Shifts
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*')
      .limit(5);

    if (shiftsError) {
      console.error('❌ Error fetching shifts:', shiftsError.message);
    } else {
      console.log(`✅ Shifts: ${shifts?.length || 0} records`);
      if (shifts && shifts.length > 0) {
        console.log('   First shift:', shifts[0].name);
      }
    }

    // Check Attendance Records
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('id, check_in, method_used')
      .limit(5);

    if (attendanceError) {
      console.error('❌ Error fetching attendance:', attendanceError.message);
    } else {
      console.log(`✅ Attendance Records: ${attendance?.length || 0} records`);
    }

    // Check Leave Requests
    const { data: leaves, error: leavesError } = await supabase
      .from('leave_requests')
      .select('id, leave_type, status')
      .limit(5);

    if (leavesError) {
      console.error('❌ Error fetching leave requests:', leavesError.message);
    } else {
      console.log(`✅ Leave Requests: ${leaves?.length || 0} records`);
    }

    // Check QR Codes
    const { data: qrCodes, error: qrError } = await supabase
      .from('qr_codes')
      .select('id, expires_at')
      .limit(5);

    if (qrError) {
      console.error('❌ Error fetching QR codes:', qrError.message);
    } else {
      console.log(`✅ QR Codes: ${qrCodes?.length || 0} records`);
    }

    // Check Color Codes
    const { data: colorCodes, error: colorError } = await supabase
      .from('color_codes')
      .select('id, current_color')
      .limit(5);

    if (colorError) {
      console.error('❌ Error fetching color codes:', colorError.message);
    } else {
      console.log(`✅ Color Codes: ${colorCodes?.length || 0} records`);
    }

    // Check Numeric Codes
    const { data: numericCodes, error: numericError } = await supabase
      .from('numeric_codes')
      .select('id, code')
      .limit(5);

    if (numericError) {
      console.error('❌ Error fetching numeric codes:', numericError.message);
    } else {
      console.log(`✅ Numeric Codes: ${numericCodes?.length || 0} records`);
    }

    console.log('\n✅ Database check completed!');

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Unexpected error:', message);
  }
}

checkDatabase();
