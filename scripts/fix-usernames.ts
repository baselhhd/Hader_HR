/**
 * Script to fix usernames in the database
 * Run with: npx tsx scripts/fix-usernames.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ccqfviqftfbywlobyjev.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcWZ2aXFmdGZieXdsb2J5amV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQzOTk4MSwiZXhwIjoyMDc2MDE1OTgxfQ.2x5uOBOxI8K6NTQtl3BT9N6zpBdyI1YhhDKErEZhrsA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
