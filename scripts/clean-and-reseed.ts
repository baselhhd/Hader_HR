/**
 * Script to clean old data and reseed with correct data
 * Run with: npx tsx scripts/clean-and-reseed.ts
 */

import { supabaseAdmin as supabase } from './_env-config';

async function cleanAndReseed() {
  console.log('🧹 Starting cleanup and reseeding...\n');

  try {
    // 1. Delete all auth users first
    console.log('🗑️  Deleting old auth users...');
    const { data: { users } } = await supabase.auth.admin.listUsers();

    for (const user of users) {
      console.log(`   Deleting user: ${user.email}`);
      await supabase.auth.admin.deleteUser(user.id);
    }
    console.log('✅ Auth users deleted\n');

    // 2. Delete all data from tables (in correct order due to foreign keys)
    console.log('🗑️  Deleting old database records...');

    await supabase.from('attendance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('leave_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('verification_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('employees').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('location_managers').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('qr_codes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('color_codes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('numeric_codes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('shifts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('locations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('branches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('✅ Database records deleted\n');

    console.log('✅ Cleanup completed!\n');
    console.log('▶️  Now run: npx tsx scripts/seed-database.ts\n');

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error during cleanup:', message);
    console.error(error);
  }
}

cleanAndReseed();
