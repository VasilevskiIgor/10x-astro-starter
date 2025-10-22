# Test AI Generation

## Setup
1. Open browser at http://localhost:3003
2. Login or register user
3. Create a new trip with destination "Paris, France", dates "2025-11-01" to "2025-11-05"

## Test Steps
1. Go to trip detail page
2. Click "Generate AI Itinerary" button
3. Wait for generation (should show loading spinner)
4. Verify AI content appears with:
   - Summary
   - Day-by-day itinerary (5 days)
   - Each day has activities with times, locations, costs
   - Recommendations section

## Expected Console Logs
```
[TripDetail] Starting AI generation for trip: <trip-id>
[OpenRouter] Starting generation: { destination, duration, model }
[OpenRouter] Generation successful: { model, tokens, cost, duration }
[TripDetail] AI generation response: 200 { ai_generated_content, ... }
[TripDetail] AI generation successful
```

## Check Database
After generation, verify in Supabase:
- trips.status = 'completed'
- trips.ai_generated_content is not null
- trips.ai_model = 'openai/gpt-3.5-turbo'
- trips.ai_tokens_used > 0
- trips.ai_generation_time_ms > 0
