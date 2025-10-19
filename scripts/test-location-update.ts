/**
 * Test Location Update with Service Role Key
 *
 * This script tests if we can update a location using the service role key
 * to understand if the issue is with RLS or something else.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

// Create two clients: one with service role, one with anon key (like the app uses)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

const testLocationId = '20000000-0000-0000-0000-000000000002';
const testCompanyId = '00000000-0000-0000-0000-000000000001';

async function testLocationUpdate() {
  console.log('🧪 Testing Location Update...\n');

  // Step 1: Get current data
  console.log('1️⃣ Fetching current location data with SERVICE role...');
  const { data: beforeService, error: errorBeforeService } = await supabaseService
    .from('locations')
    .select('*')
    .eq('id', testLocationId)
    .single();

  if (errorBeforeService) {
    console.error('❌ Error fetching with service role:', errorBeforeService);
    return;
  }

  console.log('✅ Current data (SERVICE):', {
    name: beforeService.name,
    gps_radius: beforeService.gps_radius,
    updated_at: beforeService.updated_at
  });

  // Step 2: Try to update with SERVICE role
  console.log('\n2️⃣ Attempting UPDATE with SERVICE role key...');
  const newRadius = beforeService.gps_radius + 1; // Increment by 1

  const { data: updateDataService, error: updateErrorService } = await supabaseService
    .from('locations')
    .update({
      gps_radius: newRadius,
      updated_at: new Date().toISOString()
    })
    .eq('id', testLocationId)
    .eq('company_id', testCompanyId)
    .select();

  if (updateErrorService) {
    console.error('❌ UPDATE failed with SERVICE role:', updateErrorService);
  } else {
    console.log('✅ UPDATE succeeded with SERVICE role!');
    console.log('Updated data:', updateDataService);
  }

  // Step 3: Try to update with ANON key (like the app does)
  console.log('\n3️⃣ Attempting UPDATE with ANON key (simulating app behavior)...');
  const newRadius2 = newRadius + 1;

  const { data: updateDataAnon, error: updateErrorAnon } = await supabaseAnon
    .from('locations')
    .update({
      gps_radius: newRadius2,
      updated_at: new Date().toISOString()
    })
    .eq('id', testLocationId)
    .eq('company_id', testCompanyId)
    .select();

  if (updateErrorAnon) {
    console.error('❌ UPDATE failed with ANON key:', updateErrorAnon);
    console.log('This is likely the issue! RLS is blocking updates with anon key.');
  } else {
    console.log('✅ UPDATE succeeded with ANON key!');
    console.log('Updated data:', updateDataAnon);
  }

  // Step 4: Verify final state
  console.log('\n4️⃣ Fetching final location data...');
  const { data: afterService, error: errorAfterService } = await supabaseService
    .from('locations')
    .select('*')
    .eq('id', testLocationId)
    .single();

  if (errorAfterService) {
    console.error('❌ Error fetching final data:', errorAfterService);
  } else {
    console.log('✅ Final data:', {
      name: afterService.name,
      gps_radius: afterService.gps_radius,
      updated_at: afterService.updated_at
    });
  }

  // Step 5: Check what content-range header would be
  console.log('\n5️⃣ Summary:');
  console.log('- SERVICE role UPDATE:', updateErrorService ? '❌ FAILED' : '✅ SUCCESS');
  console.log('- ANON key UPDATE:', updateErrorAnon ? '❌ FAILED (RLS issue)' : '✅ SUCCESS');

  if (updateErrorAnon) {
    console.log('\n🔍 Root Cause: RLS is blocking updates when using ANON key');
    console.log('📋 Solution: Need to enable RLS policies for UPDATE on locations table');
  }
}

testLocationUpdate();
