const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in environment variables');
  console.error('Make sure .env file exists in project root');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkManager2() {
  console.log('\n🔍 Checking manager2 data...\n');
  console.log('='.repeat(80));

  // Get manager2 user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'manager2')
    .single();

  if (userError) {
    console.log('❌ Error finding manager2:', userError.message);
    return;
  }

  console.log('\n✅ User "manager2" found:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Full Name: ${user.full_name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Company ID: ${user.company_id}`);
  console.log(`   Branch ID: ${user.branch_id}`);

  // Get location_manager record
  console.log('\n📍 Checking location_managers table:');
  const { data: locationManager, error: lmError } = await supabase
    .from('location_managers')
    .select(`
      *,
      locations:location_id (id, name, company_id, branch_id)
    `)
    .eq('user_id', user.id)
    .single();

  if (lmError) {
    console.log(`   ❌ Error: ${lmError.message}`);
    console.log(`   ⚠️  manager2 is NOT in location_managers table!`);
    console.log(`   This is why color codes are not being generated.`);
  } else {
    console.log('   ✅ Found in location_managers:');
    console.log(`      Location ID: ${locationManager.location_id}`);
    console.log(`      Location Name: ${locationManager.locations?.name}`);
    console.log(`      Is Primary: ${locationManager.is_primary}`);
  }

  // Check hind employee
  console.log('\n👷 Checking employee "hind":');
  const { data: hindUser, error: hindUserError } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'hind')
    .single();

  if (hindUserError) {
    console.log(`   ❌ Error: ${hindUserError.message}`);
  } else {
    console.log(`   ✅ User ID: ${hindUser.id}`);
    console.log(`   Full Name: ${hindUser.full_name}`);

    const { data: hindEmployee, error: hindEmpError } = await supabase
      .from('employees')
      .select(`
        *,
        locations:location_id (id, name)
      `)
      .eq('user_id', hindUser.id)
      .single();

    if (hindEmpError) {
      console.log(`   ❌ Error: ${hindEmpError.message}`);
    } else {
      console.log(`   Employee Number: ${hindEmployee.employee_number}`);
      console.log(`   Location ID: ${hindEmployee.location_id}`);
      console.log(`   Location Name: ${hindEmployee.locations?.name}`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

checkManager2();
