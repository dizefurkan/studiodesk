import { createAdminClient } from './lib/supabase/admin.js';

async function testRates() {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('instructor_rates')
    .select(`
      id,
      ratio_per_class,
      instructors(id, first_name, last_name),
      branches(id, name),
      dance_types(id, name)
    `);
  
  console.log('Error:', error);
  console.log('Data:', data);
}

testRates();
