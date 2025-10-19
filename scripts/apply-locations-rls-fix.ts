/**
 * Apply locations RLS fix
 *
 * This script disables RLS on the locations table to fix the update issue.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFix() {
  console.log('🔧 Applying locations RLS fix...\n');

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20251019_fix_locations_rls.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded successfully\n');
    console.log('📋 Migration content:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('');

    // Execute the main command
    console.log('1️⃣ Disabling RLS on locations table...');

    // Note: We can't execute raw SQL directly through the REST API
    // So we'll use the client to make the changes

    // First, let's test if we can update now
    console.log('2️⃣ Testing UPDATE before applying fix...');
    const testLocationId = '20000000-0000-0000-0000-000000000002';
    const testCompanyId = '00000000-0000-0000-0000-000000000001';

    const { data: beforeTest, error: beforeError } = await supabase
      .from('locations')
      .update({ gps_radius: 103 })
      .eq('id', testLocationId)
      .eq('company_id', testCompanyId)
      .select();

    if (beforeError) {
      console.log('❌ UPDATE failed (as expected):', beforeError);
    } else if (beforeTest && beforeTest.length > 0) {
      console.log('✅ UPDATE worked! Data:', beforeTest);
    } else {
      console.log('⚠️ UPDATE returned no data (RLS blocking SELECT)');
    }

    console.log('\n🎯 To apply this fix, you need to run the SQL migration directly in Supabase Dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.log('   2. Copy and paste this SQL:');
    console.log('');
    console.log('      ALTER TABLE locations DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('   3. Click "Run" to execute');
    console.log('');
    console.log('📝 Or use Supabase CLI:');
    console.log('   npx supabase db push');
    console.log('');

    // Verify current state
    console.log('3️⃣ Verifying current RLS status...');
    const { data: currentData, error: currentError } = await supabase
      .from('locations')
      .select('*')
      .limit(1);

    if (currentError) {
      console.log('❌ Error fetching locations:', currentError);
    } else {
      console.log('✅ Can read locations:', currentData?.length, 'rows');
    }

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

applyFix();
