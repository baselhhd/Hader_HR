/**
 * Check RLS Policies on locations table
 *
 * This script queries Supabase to check:
 * 1. If RLS is enabled on locations table
 * 2. What policies exist
 * 3. Specifically check UPDATE policies
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS status and policies on locations table...\n');

  try {
    // Query 1: Check if RLS is enabled
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT relrowsecurity as rls_enabled
        FROM pg_class
        WHERE relname = 'locations';
      `
    });

    if (rlsError) {
      console.log('⚠️ Could not check RLS status using rpc, trying direct query...');

      // Alternative: Query pg_tables for RLS status
      const { data: tables, error: tablesError } = await supabase
        .from('pg_tables')
        .select('*')
        .eq('tablename', 'locations');

      if (tablesError) {
        console.error('❌ Error querying tables:', tablesError);
      } else {
        console.log('📊 Table info:', tables);
      }
    } else {
      console.log('📊 RLS Status:', rlsStatus);
    }

    // Query 2: Check existing policies
    console.log('\n🔐 Checking policies on locations table...');

    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          polname as policy_name,
          polcmd as command,
          polpermissive as permissive,
          pol_roles.rolname as role
        FROM pg_policy pol
        JOIN pg_class pc ON pol.polrelid = pc.oid
        LEFT JOIN pg_roles pol_roles ON pol.polroles @> ARRAY[pol_roles.oid]
        WHERE pc.relname = 'locations';
      `
    });

    if (policiesError) {
      console.log('⚠️ Could not query policies using rpc');
      console.log('Error:', policiesError);
    } else {
      console.log('📋 Policies found:', policies);
    }

    // Query 3: Try to understand what's happening with a test query
    console.log('\n🧪 Testing a direct query to locations table...');

    const { data: locations, error: locationsError, count } = await supabase
      .from('locations')
      .select('*', { count: 'exact' })
      .limit(5);

    if (locationsError) {
      console.error('❌ Error querying locations:', locationsError);
    } else {
      console.log(`✅ Successfully retrieved ${count} locations (showing first 5):`);
      console.log(locations);
    }

    // Query 4: Check if we can find the specific location from HAR file
    console.log('\n🔎 Testing query for specific location from HAR file...');
    const testLocationId = '20000000-0000-0000-0000-000000000002';
    const testCompanyId = '00000000-0000-0000-0000-000000000001';

    const { data: testLocation, error: testError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', testLocationId)
      .eq('company_id', testCompanyId);

    if (testError) {
      console.error('❌ Error finding test location:', testError);
    } else {
      console.log('📍 Test location found:', testLocation);
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkRLSPolicies();
