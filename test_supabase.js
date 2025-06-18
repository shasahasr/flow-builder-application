import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Checking Supabase configuration...');
  
  try {
    // Test connection
    const { data: tableData, error: tableError } = await supabase
      .from('workflows')
      .select('id, name, user_id')
      .limit(5);
      
    if (tableError) {
      console.error('Error accessing workflows table:', tableError.message);
      if (tableError.code === '42P01') {
        console.error('Table "workflows" does not exist. You need to run the SQL setup script.');
      }
      process.exit(1);
    }
    
    console.log('Found workflows table with data:', tableData);
    console.log(`Total workflows found: ${tableData.length}`);
    
    if (tableData.length > 0) {
      // Get unique user IDs
      const userIds = [...new Set(tableData.map(row => row.user_id))];
      console.log(`Workflows belong to ${userIds.length} different users:`, userIds);
    } else {
      console.log('No workflows found in the table.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

run();
