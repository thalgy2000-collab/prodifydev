// Check RLS policies via the Supabase Management API
// We need the service_role key or to check through the dashboard
// Let's try to check if there's a difference by querying the pg_policies view via RPC

const SUPABASE_URL = "https://lyfvpwnrseavtxlmlzis.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZnZwd25yc2VhdnR4bG1semlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MzMzOTUsImV4cCI6MjA4OTEwOTM5NX0.J5zoAHmNFky8zK6Jpm9pltGVspdrzl2pqol6FWMQIVk";

// The RLS error means policies exist but INSERT is being denied.
// For quantitative_research it works - let's check if maybe the issue is 
// that the RLS policy on the other tables checks auth.uid() = user_id 
// but the insert is using a different field name.

// Actually, let's check by looking at the handleSubmit more carefully.
// The RLS policy probably checks auth.uid() = user_id.
// If the app is authenticated and passing user.id correctly, it should work.

// Let me check if there's an issue with the `category` field type.
// The quantitative_research doesn't pass category, but desk_research does.
// Let's test if passing category is the problem.

async function testInsert(table, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  console.log(`\n--- ${table} INSERT ---`);
  console.log(`Status: ${res.status}`);
  const body = await res.text();
  console.log(`Response: ${body}`);
}

async function main() {
  // All tables get RLS error with anon key - that's expected.
  // The question is: why does quantitative work with the authenticated user but others don't?
  
  // Let's check the RLS policies by trying to call an RPC function
  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_rls_policies`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  console.log('RPC check_rls_policies:', rpcRes.status);
  const rpcBody = await rpcRes.text();
  console.log(rpcBody);

  // Let's try the RLS query another way
  // Check if we can read pg_policies
  const pgRes = await fetch(`${SUPABASE_URL}/rest/v1/pg_policies?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  });
  console.log('\npg_policies:', pgRes.status);
  const pgBody = await pgRes.text();
  console.log(pgBody.substring(0, 1000));
}

main();
