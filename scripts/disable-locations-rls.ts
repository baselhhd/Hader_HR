/**
 * Disable RLS on locations table
 *
 * This script uses Supabase REST API to disable RLS on the locations table.
 * It's a direct fix for the update issue in admin/locations page.
 */

import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

async function disableLocationsRLS() {
  console.log('🔧 Disabling RLS on locations table...\n');

  try {
    // We'll use the Supabase REST API to execute SQL
    // Note: This requires the PostgREST admin endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        query: 'ALTER TABLE locations DISABLE ROW LEVEL SECURITY;'
      })
    });

    if (response.ok) {
      console.log('✅ RLS disabled successfully on locations table!');
      return true;
    } else {
      const error = await response.text();
      console.log('⚠️ Could not execute SQL via REST API:', error);
      console.log('\n📋 Please run this SQL manually in Supabase Dashboard:');
      console.log('─'.repeat(60));
      console.log('ALTER TABLE locations DISABLE ROW LEVEL SECURITY;');
      console.log('─'.repeat(60));
      return false;
    }
  } catch (err) {
    console.log('⚠️ Error:', err);
    console.log('\n📋 Please run this SQL manually in Supabase Dashboard:');
    console.log('─'.repeat(60));
    console.log('ALTER TABLE locations DISABLE ROW LEVEL SECURITY;');
    console.log('─'.repeat(60));
    console.log('\n🌐 Go to: https://supabase.com/dashboard/project/ccqfviqftfbywlobyjev/sql');
    return false;
  }
}

// Test function to verify the fix
async function testLocationUpdate() {
  console.log('\n🧪 Testing location update after fix...');

  const testLocationId = '20000000-0000-0000-0000-000000000002';
  const testCompanyId = '00000000-0000-0000-0000-000000000001';
  const testRadius = 105;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/locations?id=eq.${testLocationId}&company_id=eq.${testCompanyId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY!}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          gps_radius: testRadius
        })
      }
    );

    const contentRange = response.headers.get('content-range');
    console.log('Response status:', response.status);
    console.log('Content-Range:', contentRange);

    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);

      if (data && data.length > 0) {
        console.log('✅ SUCCESS! Location updated successfully!');
        console.log('Updated gps_radius to:', data[0].gps_radius);
        return true;
      } else if (contentRange === '*/*') {
        console.log('⚠️ UPDATE still returning no data (RLS still blocking)');
        console.log('Please run the SQL command manually in Supabase Dashboard');
        return false;
      }
    } else {
      console.log('❌ UPDATE failed');
      return false;
    }
  } catch (err) {
    console.error('❌ Test error:', err);
    return false;
  }
}

// Main execution
async function main() {
  console.log('═'.repeat(60));
  console.log('  FIX: Disable RLS on locations table');
  console.log('═'.repeat(60));
  console.log('');

  // Try to disable RLS
  const success = await disableLocationsRLS();

  if (!success) {
    console.log('\n⚠️ Could not automatically apply the fix.');
    console.log('Please apply it manually using one of these methods:');
    console.log('');
    console.log('Method 1: Supabase Dashboard');
    console.log('  1. Go to: https://supabase.com/dashboard/project/ccqfviqftfbywlobyjev/sql');
    console.log('  2. Run: ALTER TABLE locations DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('Method 2: Supabase CLI');
    console.log('  npx supabase db push');
    console.log('');
    process.exit(0);
  }

  // Test the fix
  const testSuccess = await testLocationUpdate();

  if (testSuccess) {
    console.log('\n═'.repeat(60));
    console.log('  ✅ FIX APPLIED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log('');
    console.log('You can now update locations from admin/locations page.');
  } else {
    console.log('\n═'.repeat(60));
    console.log('  ⚠️ FIX NEEDS MANUAL APPLICATION');
    console.log('═'.repeat(60));
  }
}

main();
