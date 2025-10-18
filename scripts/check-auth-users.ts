/**
 * Check Auth Users in Supabase
 */

import { supabaseAdmin as supabase } from './_env-config';

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
