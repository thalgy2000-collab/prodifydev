import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Testing insert into desk_research...");
  
  // Try to insert a dummy record
  // Replace these UUIDs with valid ones or rely on RLS failing
  const { data, error } = await supabase.from('desk_research').insert({
    product_id: '00000000-0000-0000-0000-000000000000', // We might get a foreign key violation or RLS error
    user_id: '00000000-0000-0000-0000-000000000000',
    title: 'Test',
    source: 'Test Source',
    category: 'Artigo',
    url: 'http://test.com',
    relevance: 'Test relevance',
  });

  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success:", data);
  }
}

testInsert();
