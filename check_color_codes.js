require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColorCodes() {
  console.log('🔍 Checking color_codes table...\n');

  // Get all color codes
  const { data: colorCodes, error } = await supabase
    .from('color_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Found ${colorCodes?.length || 0} color codes\n`);

  if (colorCodes && colorCodes.length > 0) {
    colorCodes.forEach((code, index) => {
      const expiresAt = new Date(code.expires_at);
      const now = new Date();
      const isExpired = expiresAt < now;

      console.log(`Color Code #${index + 1}:`);
      console.log(`  ID: ${code.id}`);
      console.log(`  Location ID: ${code.location_id}`);
      console.log(`  Current Color: ${code.current_color}`);
      console.log(`  Created: ${new Date(code.created_at).toLocaleString()}`);
      console.log(`  Expires: ${expiresAt.toLocaleString()}`);
      console.log(`  Status: ${isExpired ? '❌ Expired' : '✅ Valid'}`);
      console.log('---');
    });
  } else {
    console.log('⚠️  No color codes found in database');
  }

  // Check for active codes
  const { data: activeCodes, error: activeError } = await supabase
    .from('color_codes')
    .select('*')
    .gt('expires_at', new Date().toISOString());

  if (!activeError) {
    console.log(`\n✅ Active color codes: ${activeCodes?.length || 0}`);
  }
}

checkColorCodes();
