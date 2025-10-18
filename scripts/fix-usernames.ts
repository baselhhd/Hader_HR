/**
 * Script to fix usernames in the database
 * Run with: npx tsx scripts/fix-usernames.ts
 */

import { supabaseAdmin as supabase } from './_env-config';

async function fixUsernames() {
  console.log('🔧 Fixing usernames...\n');

  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;

    console.log(`Found ${users.length} users\n`);

    for (const user of users) {
      let newUsername = '';
      let newRole = '';
      let newEmail: string | null = null;
      let newPhone: string | null = null;

      // Fix based on email
      if (user.id && user.username) {
        if (user.username.includes('ahmed_ali') || user.username.includes('employee')) {
          newUsername = 'ahmed_ali';
          newRole = 'employee';
          newEmail = null;  // داخلي
          newPhone = '+966501234567';
          console.log(`Fixing employee user...`);
        } else if (user.username.includes('khaled') || user.username.includes('manager')) {
          newUsername = 'khaled_manager';
          newRole = 'loc_manager';
          newEmail = 'khaled@company.com'; // حقيقي
          newPhone = '+966507654321';
          console.log(`Fixing manager user...`);
        } else if (user.username.includes('fatima') || user.username.includes('hr')) {
          newUsername = 'fatima_hr';
          newRole = 'hr_admin';
          newEmail = null; // داخلي
          newPhone = null;
          console.log(`Fixing HR user...`);
        }

        if (newUsername) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              username: newUsername,
              role: newRole,
              email: newEmail,
              phone: newPhone
            })
            .eq('id', user.id);

          if (updateError) {
            console.error(`❌ Error updating user ${user.id}:`, updateError.message);
          } else {
            console.log(`✅ Updated: ${newUsername} (${newRole})`);
            console.log(`   Email: ${newEmail || 'داخلي'}`);
            console.log(`   Phone: ${newPhone || 'غير محدد'}\n`);
          }
        }
      }
    }

    console.log('✅ Usernames fixed!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

fixUsernames();
