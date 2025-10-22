/**
 * Helper script to get a JWT token from Supabase
 * Automatically reads configuration from .env file
 *
 * Usage:
 *   node scripts/get-token.js
 *
 * Prerequisites:
 *   - .env file configured with SUPABASE_URL and SUPABASE_KEY
 *   - Test user created in Supabase (email: test@example.com, password: password123)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env file
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return env;
  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
    console.error('\nMake sure .env file exists in the project root.');
    console.error('Copy .env.example to .env if needed.\n');
    process.exit(1);
  }
}

const env = loadEnv();

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_KEY;

// Default test credentials (update these if needed)
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('\nMake sure your .env file contains:');
  console.error('  SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_KEY=your-anon-key\n');
  process.exit(1);
}

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
      console.error('1. Supabase is running (or remote Supabase is accessible)');
      console.error('2. Test user exists with email:', TEST_EMAIL);
      console.error('3. Password is correct:', TEST_PASSWORD);
      console.error('4. SUPABASE_URL and SUPABASE_KEY in .env are correct\n');
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

    console.log('\n\n📝 For Postman:');
    console.log('URL: POST http://localhost:3000/api/trips');
    console.log('Headers:');
    console.log('  Content-Type: application/json');
    console.log('  Authorization: Bearer', data.access_token);

    return data.access_token;
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. Supabase is accessible at:', SUPABASE_URL);
    console.error('2. Your internet connection is working (if using remote Supabase)\n');
    process.exit(1);
  }
}

// Run the script
getTestToken();
