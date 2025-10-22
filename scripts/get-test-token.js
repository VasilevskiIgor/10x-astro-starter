/**
 * Helper script to get a test JWT token from local Supabase
 *
 * Usage:
 *   node scripts/get-test-token.js
 *
 * Prerequisites:
 *   - Supabase running locally (supabase start)
 *   - Test user created in local Supabase
 */

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Default test credentials (update these if needed)
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

async function getTestToken() {
  try {
    console.log('🔑 Attempting to get JWT token for test user...\n');
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Supabase URL: ${SUPABASE_URL}\n`);

    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to authenticate:', error);
      console.error('\nMake sure:');
      console.error('1. Supabase is running (supabase start)');
      console.error('2. Test user exists with correct credentials');
      console.error('3. Update TEST_EMAIL and TEST_PASSWORD in this script if needed\n');
      process.exit(1);
    }

    const data = await response.json();

    console.log('✅ Successfully authenticated!\n');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('\n📋 JWT Token (copy this for testing):\n');
    console.log(data.access_token);
    console.log('\n🚀 Test the endpoint with:\n');
    console.log(`curl -X POST http://localhost:3000/api/trips \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${data.access_token}" \\
  -d '{
    "destination": "Paris, France",
    "start_date": "2025-06-01",
    "end_date": "2025-06-05",
    "description": "Test trip"
  }'`);

    console.log('\n💾 Token expires at:', new Date(data.expires_at * 1000).toLocaleString());

    return data.access_token;
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure Supabase is running: supabase start\n');
    process.exit(1);
  }
}

// Run the script
getTestToken();
