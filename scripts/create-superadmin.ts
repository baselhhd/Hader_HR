/**
 * Script to create Super Admin user
 * Run with: npx tsx scripts/create-superadmin.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ccqfviqftfbywlobyjev.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcWZ2aXFmdGZieXdsb2J5amV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQzOTk4MSwiZXhwIjoyMDc2MDE1OTgxfQ.2x5uOBOxI8K6NTQtl3BT9N6zpBdyI1YhhDKErEZhrsA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function generateInternalEmail(username: string): string {
  const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '_');
  return `${cleanUsername}@internal.hader.local`;
}

async function createSuperAdmin() {
  console.log('🔧 Creating Super Admin user...\n');

  const username = 'admin';
  const password = 'Admin123!';
  const internalEmail = generateInternalEmail(username);

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username)
      .single();

    if (existingUser) {
      console.log('⚠️  Super Admin user already exists:');
      console.log(`   Username: ${username}`);
      console.log(`   User ID: ${existingUser.id}`);
      console.log('\n✅ No action needed.\n');
      return;
    }

    // Step 1: Create user in Auth
    console.log('1️⃣ Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: internalEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: username,
      },
    });

    if (authError || !authData.user) {
      console.error('❌ Error creating auth user:', authError?.message);
      return;
    }

    console.log(`   ✅ Auth user created with ID: ${authData.user.id}`);

    // Step 2: Add user to users table
    console.log('\n2️⃣ Adding user to users table...');
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username: username,
        full_name: 'المدير العام',
        email: null, // Internal email
        phone: null,
        role: 'super_admin',
      });

    if (userError) {
      console.error('❌ Error adding user to users table:', userError.message);
      // Cleanup: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }

    console.log('   ✅ User added to users table');

    // Success!
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Super Admin user created successfully!');
    console.log('='.repeat(60));
    console.log('\n📋 Login Credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: super_admin`);
    console.log('\n🔗 Login URL: http://localhost:8080/login');
    console.log('\n📍 Dashboard: /admin/dashboard');
    console.log('\n✨ You can now login and manage the entire system!\n');

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createSuperAdmin();
