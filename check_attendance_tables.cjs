const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ccqfviqftfbywlobyjev.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcWZ2aXFmdGZieXdsb2J5amV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0Mzk5ODEsImV4cCI6MjA3NjAxNTk4MX0.tjSaWUXor9GZVza1bSygNfGl0DVIRB9p5LKscSyBC9U";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceTables() {
  console.log('\n🔍 Checking Attendance System Tables...\n');
  console.log('=' .repeat(80));

  // Check color_codes
  console.log('\n📋 COLOR CODES Table:');
  const { data: colorCodes, error: colorError } = await supabase
    .from('color_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (colorError) {
    console.log('❌ Error:', colorError.message);
  } else {
    console.log(`✅ Total records: ${colorCodes?.length || 0}`);
    if (colorCodes && colorCodes.length > 0) {
      colorCodes.forEach((code, index) => {
        const expiresAt = new Date(code.expires_at);
        const now = new Date();
        const isExpired = expiresAt < now;
        console.log(`\n  #${index + 1}:`);
        console.log(`    Location ID: ${code.location_id}`);
        console.log(`    Color: ${code.current_color}`);
        console.log(`    Expires: ${expiresAt.toLocaleString()}`);
        console.log(`    Status: ${isExpired ? '❌ Expired' : '✅ Active'}`);
      });
    }
  }

  // Check numeric_codes
  console.log('\n\n📋 NUMERIC CODES Table:');
  const { data: numericCodes, error: numericError } = await supabase
    .from('numeric_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (numericError) {
    console.log('❌ Error:', numericError.message);
  } else {
    console.log(`✅ Total records: ${numericCodes?.length || 0}`);
    if (numericCodes && numericCodes.length > 0) {
      numericCodes.forEach((code, index) => {
        const expiresAt = new Date(code.expires_at);
        const now = new Date();
        const isExpired = expiresAt < now;
        console.log(`\n  #${index + 1}:`);
        console.log(`    Location ID: ${code.location_id}`);
        console.log(`    Code: ${code.code}`);
        console.log(`    Expires: ${expiresAt.toLocaleString()}`);
        console.log(`    Status: ${isExpired ? '❌ Expired' : '✅ Active'}`);
      });
    }
  }

  // Check qr_codes
  console.log('\n\n📋 QR CODES Table:');
  const { data: qrCodes, error: qrError } = await supabase
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (qrError) {
    console.log('❌ Error:', qrError.message);
  } else {
    console.log(`✅ Total records: ${qrCodes?.length || 0}`);
    if (qrCodes && qrCodes.length > 0) {
      qrCodes.forEach((code, index) => {
        const expiresAt = new Date(code.expires_at);
        const now = new Date();
        const isExpired = expiresAt < now;
        console.log(`\n  #${index + 1}:`);
        console.log(`    Location ID: ${code.location_id}`);
        console.log(`    Code (first 20 chars): ${code.code_data.substring(0, 20)}...`);
        console.log(`    Expires: ${expiresAt.toLocaleString()}`);
        console.log(`    Status: ${isExpired ? '❌ Expired' : '✅ Active'}`);
      });
    }
  }

  // Check attendance_records
  console.log('\n\n📋 ATTENDANCE RECORDS Table:');
  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance_records')
    .select('id, employee_id, check_in, method_used, status')
    .order('check_in', { ascending: false })
    .limit(5);

  if (attendanceError) {
    console.log('❌ Error:', attendanceError.message);
  } else {
    console.log(`✅ Total recent records: ${attendance?.length || 0}`);
    if (attendance && attendance.length > 0) {
      attendance.forEach((record, index) => {
        console.log(`\n  #${index + 1}:`);
        console.log(`    Employee ID: ${record.employee_id}`);
        console.log(`    Check-in: ${new Date(record.check_in).toLocaleString()}`);
        console.log(`    Method: ${record.method_used}`);
        console.log(`    Status: ${record.status}`);
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Check complete!\n');
}

checkAttendanceTables();
