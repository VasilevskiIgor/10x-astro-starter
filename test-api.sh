#!/bin/bash

# Test script for AI Generation API
# Requires: curl, jq (optional for pretty JSON)

# Configuration
BASE_URL="http://localhost:3001"
SUPABASE_URL="http://127.0.0.1:54321"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Test credentials
TEST_EMAIL="test@example.com"
TEST_PASSWORD="test123456"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== AI Generation API Test ==="
echo ""

# Step 1: Login and get JWT token
echo -e "${YELLOW}Step 1: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\"
  }")

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Login successful${NC}"
  echo "Token: ${JWT_TOKEN:0:50}..."
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  echo ""
  echo -e "${YELLOW}Creating new user...${NC}"

  # Try to create user
  SIGNUP_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/signup" \
    -H "apikey: ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${TEST_EMAIL}\",
      \"password\": \"${TEST_PASSWORD}\"
    }")

  if echo "$SIGNUP_RESPONSE" | grep -q "access_token"; then
    JWT_TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ User created and logged in${NC}"
  else
    echo -e "${RED}✗ Failed to create user${NC}"
    echo "Response: $SIGNUP_RESPONSE"
    exit 1
  fi
fi

echo ""

# Step 2: Create a test trip
echo -e "${YELLOW}Step 2: Creating test trip...${NC}"
CREATE_TRIP_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/trips" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Tokyo, Japan",
    "start_date": "2025-06-01",
    "end_date": "2025-06-07",
    "description": "First time in Japan, interested in culture, food, and technology. Would like to visit temples, try authentic ramen, and see modern Tokyo.",
    "generate_ai": false
  }')

if echo "$CREATE_TRIP_RESPONSE" | grep -q '"id"'; then
  TRIP_ID=$(echo "$CREATE_TRIP_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Trip created${NC}"
  echo "Trip ID: $TRIP_ID"
else
  echo -e "${RED}✗ Failed to create trip${NC}"
  echo "Response: $CREATE_TRIP_RESPONSE"
  exit 1
fi

echo ""

# Step 3: Generate AI itinerary
echo -e "${YELLOW}Step 3: Generating AI itinerary...${NC}"
echo "This may take 30-60 seconds..."

AI_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/trips/${TRIP_ID}/generate-ai" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "temperature": 0.7
  }')

if echo "$AI_RESPONSE" | grep -q '"status":"completed"'; then
  echo -e "${GREEN}✓ AI generation completed${NC}"

  # Extract some details
  TOKENS=$(echo "$AI_RESPONSE" | grep -o '"ai_tokens_used":[0-9]*' | cut -d':' -f2)
  TIME_MS=$(echo "$AI_RESPONSE" | grep -o '"ai_generation_time_ms":[0-9]*' | cut -d':' -f2)

  echo "Tokens used: $TOKENS"
  echo "Generation time: ${TIME_MS}ms"

  # Save full response to file
  echo "$AI_RESPONSE" > ai_response.json
  echo -e "${GREEN}Full response saved to ai_response.json${NC}"
else
  echo -e "${RED}✗ AI generation failed${NC}"
  echo "Response: $AI_RESPONSE"
  exit 1
fi

echo ""

# Step 4: Retrieve trip with AI content
echo -e "${YELLOW}Step 4: Retrieving trip with AI content...${NC}"
TRIP_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/trips/${TRIP_ID}" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

if echo "$TRIP_RESPONSE" | grep -q '"ai_generated_content"'; then
  echo -e "${GREEN}✓ Trip retrieved with AI content${NC}"

  # Count activities
  ACTIVITY_COUNT=$(echo "$TRIP_RESPONSE" | grep -o '"activities"' | wc -l)
  echo "Number of days with activities: $ACTIVITY_COUNT"

  echo "$TRIP_RESPONSE" > trip_with_ai.json
  echo -e "${GREEN}Full trip saved to trip_with_ai.json${NC}"
else
  echo -e "${RED}✗ Failed to retrieve trip${NC}"
  echo "Response: $TRIP_RESPONSE"
fi

echo ""

# Step 5: Check rate limits
echo -e "${YELLOW}Step 5: Checking rate limits...${NC}"
RATE_LIMITS_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/users/me/rate-limits" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

if echo "$RATE_LIMITS_RESPONSE" | grep -q '"hourly"'; then
  echo -e "${GREEN}✓ Rate limits retrieved${NC}"
  echo "Response: $RATE_LIMITS_RESPONSE"
else
  echo -e "${YELLOW}⚠ Rate limits endpoint might not be implemented yet${NC}"
  echo "Response: $RATE_LIMITS_RESPONSE"
fi

echo ""
echo -e "${GREEN}=== Test completed ===${NC}"
echo ""
echo "Summary:"
echo "- Trip ID: $TRIP_ID"
echo "- Files created: ai_response.json, trip_with_ai.json"
echo ""
echo "To view the AI-generated content:"
echo "  cat trip_with_ai.json | jq '.ai_generated_content'"
