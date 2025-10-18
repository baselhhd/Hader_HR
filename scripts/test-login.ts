/**
 * سكريبت اختبار تسجيل الدخول
 * Run with: npx tsx scripts/test-login.ts
 */

import { supabaseAnon as supabase } from './_env-config';

async function testLogin() {
  console.log('🧪 Testing Login Flow...\n');

  const testAccounts = [
    { username: 'ahmed_ali', password: 'Test123!', role: 'employee' },
    { username: 'fatima_hr', password: 'Test123!', role: 'hr_admin' },
    { username: 'khaled_manager', password: 'Test123!', role: 'loc_manager' },
  ];

  for (const account of testAccounts) {
    console.log(`\n📝 Testing: ${account.username} (${account.role})`);
    console.log('─'.repeat(50));

    try {
      // Step 1: Lookup username in users table
      console.log('1️⃣ Looking up username in database...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, role')
        .eq('username', account.username)
        .single();

      if (userError) {
        console.error('   ❌ Database lookup failed:', userError.message);
        continue;
      }

      console.log(`   ✅ Found user: ${userData.username} (${userData.role})`);

      // Step 2: Generate internal email
      const authEmail = `${account.username}@internal.hader.local`;
      console.log(`2️⃣ Using auth email: ${authEmail}`);

      // Step 3: Attempt login
      console.log('3️⃣ Attempting authentication...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: account.password,
      });

      if (authError) {
        console.error('   ❌ Authentication failed:', authError.message);
        continue;
      }

      console.log('   ✅ Authentication successful!');
      console.log(`   User ID: ${authData.user?.id}`);
      console.log(`   Email: ${authData.user?.email}`);

      // Step 4: Sign out
      await supabase.auth.signOut();
      console.log('4️⃣ Signed out successfully');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('   ❌ Unexpected error:', message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Login test completed!\n');
}

testLogin();
