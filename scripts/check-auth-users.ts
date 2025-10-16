/**
 * Check Auth Users in Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ccqfviqftfbywlobyjev.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcWZ2aXFmdGZieXdsb2J5amV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQzOTk4MSwiZXhwIjoyMDc2MDE1OTgxfQ.2x5uOBOxI8K6NTQtl3BT9N6zpBdyI1YhhDKErEZhrsA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAuthUsers() {
  console.log('🔍 Checking Supabase Auth Users...\n');

  try {
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error fetching auth users:', error.message);
      return;
    }

    console.log(`✅ Total Auth Users: ${data.users.length}\n`);

    data.users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString('ar-SA')}`);
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅' : '❌'}`);
      console.log('');
    });

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkAuthUsers();
