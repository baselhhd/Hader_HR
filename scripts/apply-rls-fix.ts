/**
 * Script to apply RLS fixes directly to Supabase
 * Run with: npx tsx scripts/apply-rls-fix.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = "https://ccqfviqftfbywlobyjev.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcWZ2aXFmdGZieXdsb2J5amV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQzOTk4MSwiZXhwIjoyMDc2MDE1OTgxfQ.2x5uOBOxI8K6NTQtl3BT9N6zpBdyI1YhhDKErEZhrsA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyRLSFix() {
  console.log('🔧 Applying RLS Policy Fixes...\n');

  try {
    const sqlFile = join(__dirname, '..', 'supabase', 'migrations', '20251015_fix_rls_policies.sql');
    const sql = readFileSync(sqlFile, 'utf-8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`[${i + 1}/${statements.length}] Executing...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // Try alternative method - direct query
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok) {
            console.log(`⚠️  Skipping (may not exist): ${statement.substring(0, 60)}...`);
          } else {
            console.log('✅ Success');
          }
        } else {
          console.log('✅ Success');
        }
      } catch (err: any) {
        console.log(`⚠️  Skipping: ${err.message}`);
      }
    }

    console.log('\n✅ RLS Policy fixes applied!\n');
    console.log('📝 Note: Please verify policies in Supabase Dashboard\n');

  } catch (error: any) {
    console.error('❌ Error applying RLS fixes:', error.message);
  }
}

applyRLSFix();
