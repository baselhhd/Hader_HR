/**
 * Make fatima_hr a Super Admin temporarily for testing
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ccqfviqftfbywlobyjev.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcWZ2aXFmdGZieXdsb2J5amV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQzOTk4MSwiZXhwIjoyMDc2MDE1OTgxfQ.2x5uOBOxI8K6NTQtl3BT9N6zpBdyI1YhhDKErEZhrsA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

makeSuperAdmin();
