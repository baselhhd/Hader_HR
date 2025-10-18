/**
 * Script to list all auth users
 * Run with: npx tsx scripts/list-auth-users.ts
 */

import { supabaseAdmin as supabase } from './_env-config';

async function listUsers() {
  console.log('👥 Listing all auth users...\n');

  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) throw error;

    console.log(`Found ${users.length} users:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log('');
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error:', message);
  }
}

listUsers();
