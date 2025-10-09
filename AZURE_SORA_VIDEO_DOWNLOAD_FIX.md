# 🎬 Azure Sora Video Download - Diagnostic Guide

## Problem Summary

Azure Sora API successfully generates videos but returns 404 when trying to download the video content via the `/content` endpoint.

### Error Pattern
```
🎬 Sora - Video generated successfully: https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/gen_01k74ge5w8et5tev9zdtdd1enc/content
Failed to download generated video: 404 {"error":{"code":"404","message": "Resource not found"}}
```

## Root Cause

The Azure Sora API generates videos asynchronously. After the job status is `succeeded`, the video **may not be immediately available** at the `/content` endpoint. There are several possibilities:

1. **Delayed availability**: The video file needs additional processing time after job completion
2. **Different endpoint**: Azure might use a different URL structure than documented
3. **Signed URLs required**: The video might only be accessible via a time-limited signed URL
4. **Additional API call needed**: May require a separate API call to request video export/download

## Current Behavior from Logs

### What Works ✅
- Job creation returns 201 with job ID
- Polling works correctly (preprocessing → running → processing → succeeded)
- Generation metadata endpoint returns 200:
  ```json
  {
    "object": "video.generation",
    "id": "gen_01k74ge5w8et5tev9zdtdd1enc",
    "job_id": "task_01k74gdt4zetst8kf1097tp986",
    "created_at": 1760014315,
    "width": 1080,
    "height": 1080,
    "n_seconds": 1,
    "prompt": "..."
  }
  ```

### What Fails ❌
- All `/content` endpoints return 404:
  - `GET /openai/v1/video/generations/{gen_id}/content?api-version=preview` → 404
  - `GET /openai/v1/generations/{gen_id}/content?api-version=preview` → 404
  - `GET /openai/v1/video/generations/{gen_id}/content` → 404

## Implemented Fixes

### 1. Enhanced Logging in `app/api/generate/route.ts`
- Added detailed logging for video download (status, headers, size)
- Log Supabase upload with buffer size and bucket details
- Log public/signed URL generation
- Added error details for debugging

### 2. Updated Sora Library (`lib/sora.ts`)
- Extract base URL from AZURE_SORA_ENDPOINT dynamically
- Try metadata endpoint first to look for video URL in response
- Check multiple possible URL fields: `url`, `content_url`, `video_url`, `output_url`
- Improved error handling and logging

### 3. Added API Key to Video Download
- Added `Api-key` header to video download request in `route.ts`
- Azure requires authentication even for resource download

### 4. Database Schema Improvements
- Created `supabase-schema-improved.sql` with:
  - Better column types and constraints
  - Indexes for performance
  - Proper RLS policies
  - Automatic bucket creation
  - Validation checks

## Next Steps to Resolve

### Option A: Wait After Job Completion (Recommended to try first)
Add a delay after job succeeds before attempting download:

```typescript
// In lib/sora.ts, after job status === 'succeeded'
console.log('🎬 Sora - Job succeeded, waiting for video to be ready...');
await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

// Then try to fetch content
```

### Option B: Check Azure Sora Documentation
The Azure OpenAI Sora API might have specific requirements:
1. Check if there's a separate "export" or "download" API call
2. Verify the correct endpoint structure in Azure's documentation
3. Check if signed URLs are required

### Option C: Alternative Download Methods

#### Try downloading from job endpoint directly:
```typescript
const jobEndpoint = `${baseUrl}/video/generations/jobs/${jobId}?api-version=preview`;
// This might include a download_url field
```

#### Try list endpoint:
```typescript
const listEndpoint = `${baseUrl}/video/generations?api-version=preview`;
// Might return videos with download links
```

### Option D: Use Azure Storage Integration
If Azure Sora supports saving directly to Azure Blob Storage:
1. Configure output to Azure Storage account
2. Download from blob storage instead
3. This is more reliable than direct API downloads

### Option E: Contact Azure Support
If the video cannot be downloaded after trying all endpoints:
- The API version `preview` might have limitations
- Contact Azure support for correct download procedure
- Check if GA (General Availability) version has different behavior

## Testing Commands

### Test video download manually:
```powershell
# Set your API key
$apiKey = $env:AZURE_API_KEY

# Try downloading (replace gen_id with actual generation ID)
$genId = "gen_01k74ge5w8et5tev9zdtdd1enc"
$url = "https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/$genId/content?api-version=preview"

curl.exe -H "Api-key: $apiKey" $url --output test-video.mp4 -v
```

### Check generation status:
```powershell
$genId = "gen_01k74ge5w8et5tev9zdtdd1enc"
$url = "https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/$genId?api-version=preview"

curl.exe -H "Api-key: $apiKey" $url
```

## Temporary Workaround

If video download continues to fail, you could:
1. Store the generation ID in the database
2. Return the generation ID to the user
3. Implement a background job that retries download after delays (5s, 10s, 30s, 60s)
4. Notify user when video is ready

## Supabase Bucket Setup

Make sure buckets exist in Supabase:

1. Go to Supabase Dashboard → Storage
2. Create two buckets:
   - `input-images` (Public: ✅)
   - `output-videos` (Public: ✅)
3. Or run the SQL script: `supabase-schema-improved.sql`

### Verify buckets via API:
```powershell
$headers = @{
  'apikey' = $env:SUPABASE_SERVICE_ROLE_KEY
  'Authorization' = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
}
Invoke-RestMethod -Uri "$env:SUPABASE_URL/storage/v1/buckets" -Headers $headers -Method GET | ConvertTo-Json -Depth 5
```

Should return both buckets in the list.

## Summary of Changes

### Files Modified:
1. ✅ `app/api/generate/route.ts` - Enhanced logging, added Api-key header to download
2. ✅ `lib/sora.ts` - Improved video URL fetching logic
3. ✅ `supabase-schema-improved.sql` - Created comprehensive schema

### Current Status:
- ✅ TypeScript compilation passes
- ✅ Sora video generation works
- ✅ Job polling works correctly
- ❌ Video download returns 404 (needs investigation)
- ⏳ Supabase upload not tested yet (blocked by download issue)

### Recommended Immediate Actions:
1. **Try adding 5-10 second delay after job succeeds** (most likely fix)
2. **Check Azure Sora documentation** for correct download procedure
3. **Test manual download** with curl command above
4. **Verify Supabase buckets exist** using commands above
5. **Consider background job approach** if instant download isn't possible
