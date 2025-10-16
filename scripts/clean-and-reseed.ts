/**
 * Script to clean old data and reseed with correct data
 * Run with: npx tsx scripts/clean-and-reseed.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ccqfviqftfbywlobyjev.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcWZ2aXFmdGZieXdsb2J5amV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQzOTk4MSwiZXhwIjoyMDc2MDE1OTgxfQ.2x5uOBOxI8K6NTQtl3BT9N6zpBdyI1YhhDKErEZhrsA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

  } catch (error: any) {
    console.error('❌ Error during cleanup:', error.message);
    console.error(error);
  }
}

cleanAndReseed();
