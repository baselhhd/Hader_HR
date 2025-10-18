/**
 * Make fatima_hr a Super Admin temporarily for testing
 */

import { supabaseAdmin as supabase } from './_env-config';

async function makeSuperAdmin() {
  console.log('🔧 Making fatima_hr a Super Admin...\n');

  try {
    const { error } = await supabase
      .from('users')
      .update({ role: 'super_admin' })
      .eq('username', 'fatima_hr');

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('✅ Success! fatima_hr is now a Super Admin\n');
    console.log('📋 Login Credentials:');
    console.log('   Username: fatima_hr');
    console.log('   Password: Test123!');
    console.log('   Role: super_admin');
    console.log('\n🔗 Login URL: http://localhost:8080/login');
    console.log('📍 Dashboard: /admin/dashboard\n');

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error:', message);
  }
}

makeSuperAdmin();
